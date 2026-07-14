import { redirect } from 'next/navigation';

export async function GET() {
  redirect('/agent-dashboard');
}
