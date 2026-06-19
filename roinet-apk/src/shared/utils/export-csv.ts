import { Share } from 'react-native';

export async function shareCsvContent(filename: string, csv: string): Promise<void> {
  await Share.share({
    message: csv,
    title: filename,
  });
}
