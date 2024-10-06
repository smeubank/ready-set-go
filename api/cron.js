import axios from 'axios';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import nodemailer from 'nodemailer';

const API_URL = 'https://api.strawpoll.com/v3/polls';

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
      multiple_choice_max: null, // Allow selecting as many options as desired
      results_visibility: 'always',
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

    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    // Set up email data
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'eubank.steven88@gmail.com',
      subject: 'Your Poll is Ready!',
      text: `Your poll has been created! Check it out here: ${pollLink}`,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    res.status(200).json({ message: 'Poll created and email sent successfully', data: response.data });
  } catch (error) {
    console.error('Error creating poll or sending email:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to create poll or send email' });
  }
}
