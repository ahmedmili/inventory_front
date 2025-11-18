import { redirect } from 'next/navigation';
import { authService } from '@/lib/auth';

export default async function Home() {
  const user = await authService.getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  redirect('/dashboard');
}

