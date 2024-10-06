import axios from 'axios';
import { format, addDays, startOfWeek } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const API_URL = 'https://api.strawpoll.com/v3/polls';

function createPollOptions() {
  const options = [];
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday as the first day of the week
  const timeZone = 'Europe/Berlin';

  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const zonedDate = utcToZonedTime(date, timeZone);
    const formattedDate = format(zonedDate, 'EEEE dd/MM');

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
      multiple_choice_max: 2,
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
        'X-API-Key': process.env.STRAWPOLL_API_KEY,
      },
    });
    console.log('Poll created successfully:', response.data);
    res.status(200).json({ message: 'Poll created successfully', data: response.data });
  } catch (error) {
    console.error('Error creating poll:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to create poll' });
  }
}
