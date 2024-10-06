import axios from 'axios';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import nodemailer from 'nodemailer';

const API_URL = 'https://api.strawpoll.com/v3/polls';
const GITHUB_API_URL = 'https://api.github.com';
const REPO_OWNER = 'smeubank';
const REPO_NAME = 'ready-set-go';
const BRANCH_NAME = 'main';

function createPollOptions() {
  const options = [];
  const startDate = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1); // Start from next Monday
  const timeZone = 'Europe/Berlin';

  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const zonedDate = toZonedTime(date, timeZone);
    const formattedDate = format(zonedDate, 'EEEE dd/MM', { timeZone });

    options.push({ type: 'text', value: `${formattedDate}` });
    options.push({ type: 'text', value: `${formattedDate} (intermediate)` });
  }

  console.log('Poll options created:', options);
  return options;
}

async function createGitHubPR(pollLink) {
  try {
    // Create a new branch
    await axios.post(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
      {
        ref: `refs/heads/${BRANCH_NAME}`,
        sha: 'main', // Replace with the SHA of the branch you want to base the new branch on
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    // Create a new file or update an existing file with poll details
    const content = Buffer.from(`New poll created: ${pollLink}`).toString('base64');
    await axios.put(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/poll-details.txt`,
      {
        message: 'Add new poll details',
        content,
        branch: BRANCH_NAME,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    // Create a pull request
    const prResponse = await axios.post(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
      {
        title: 'New Poll Created',
        head: BRANCH_NAME,
        base: 'main',
        body: `A new poll has been created. Check it out here: ${pollLink}`,
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    console.log('Pull request created successfully:', prResponse.data.html_url);
  } catch (error) {
    console.error('Error creating GitHub PR:', error.response ? error.response.data : error.message);
  }
}

export default async function handler(req, res) {
  console.log('Handler function started');

  const apiKey = process.env.STRAWPOLL_API_KEY;
  if (!apiKey) {
    console.error('API Key is missing');
    return res.status(500).json({ error: 'API Key is missing' });
  }

  console.log('Using API Key:', apiKey);

  const pollData = {
    title: 'Weekly Poll',
    poll_options: createPollOptions(),
    poll_config: {
      is_private: true,
      is_multiple_choice: true,
      multiple_choice_min: 1,
      multiple_choice_max: 10, // Set to a high number to allow multiple selections
      results_visibility: 'always',
      require_voter_names: true, // Require voters to enter their names
    },
    poll_meta: {
      timezone: 'Europe/Berlin',
    },
    type: 'multiple_choice',
  };

  console.log('Poll data prepared:', JSON.stringify(pollData, null, 2));

  try {
    console.log('Sending request to StrawPoll API...');
    const response = await axios.post(API_URL, pollData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    console.log('Poll created successfully:', response.data);

    // Send email
    const pollLink = response.data.url; // Assuming the response contains a URL to the poll
    console.log('Preparing to send email...');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'eubank.steven88@gmail.com',
      subject: 'Your Poll is Ready!',
      text: `Your poll has been created! Check it out here: ${pollLink}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    // Create a GitHub PR
    await createGitHubPR(pollLink);

    res.status(200).json({ message: 'Poll created, email sent, and PR created successfully', data: response.data });
  } catch (error) {
    console.error('Error creating poll or sending email:', error);

    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request data:', error.request);
    } else {
      console.error('Error message:', error.message);
    }

    res.status(500).json({ error: 'Failed to create poll, send email, or create PR' });
  }
}