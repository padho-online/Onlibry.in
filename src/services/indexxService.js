import { auth } from '../config/firebase';

export async function indexxRequest(
  action,
  params = {}
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Admin login required');
  }

  const token = await user.getIdToken();

  const query = new URLSearchParams({
    action,
    ...params
  });

  const response = await fetch(
    `/api/indexx?${query.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || 'IndexX request failed'
    );
  }

  return result.data;
}
