import { AspectRatio, Dimension, Topic } from './types';

export const ASPECT_RATIOS: Record<AspectRatio, Dimension> = {
  [AspectRatio.Portrait]: { width: 1080, height: 1920, label: 'Story (9:16)', ratio: 9 / 16 },
  [AspectRatio.Landscape]: { width: 1920, height: 1080, label: 'Cinema (16:9)', ratio: 16 / 9 },
  [AspectRatio.Square]: { width: 1080, height: 1080, label: 'Post (1:1)', ratio: 1 },
  [AspectRatio.Classic]: { width: 1080, height: 1440, label: 'Classic (3:4)', ratio: 3 / 4 },
};

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'gratitude',
    title: 'Daily Gratitude',
    description: 'Reflect on what made you smile today.',
    prompt: 'Start by telling me three small things that brought you joy today.',
  },
  {
    id: 'reflection',
    title: 'Self Reflection',
    description: 'Deep dive into your current state of mind.',
    prompt: 'How have you been feeling lately, really? What is weighing on your mind?',
  },
  {
    id: 'storytelling',
    title: 'Storytelling',
    description: 'Practice your narrative skills with a random memory.',
    prompt: 'Tell me about a childhood memory that still feels vivid to you.',
  },
  {
    id: 'freestyle',
    title: 'Freestyle',
    description: 'Just talk about whatever is on your mind.',
    prompt: 'The floor is yours. What do you want to talk about?',
  }
];

export const SYSTEM_INSTRUCTION = `
You are a warm, curious, and empathetic video podcast interviewer. 
Your goal is to "interview" the user as they record a video diary.
1. Listen actively to what the user says.
2. Interject occasionally with SHORT, thought-provoking questions or encouraging remarks to keep them talking or go deeper.
3. Keep your responses BRIEF (under 15 words mostly).
4. Do not interrupt too frequently; let them finish their thoughts.
5. Your output will be displayed as text on screen, so be punchy and clear.
`;
