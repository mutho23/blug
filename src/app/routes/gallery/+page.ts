export const load = async ({ fetch }) => {
  const HANDLE = 'username.bsky.social'; // ← GANTI dengan handle atproto kamu

  const didRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${HANDLE}`
  );
  const { did } = await didRes.json();

  const recordsRes = await fetch(
    `https://bsky.social/xrpc/com.atproto.repo.listRecords?repo=${did}&collection=social.grain.gallery&limit=30`
  );
  const data = await recordsRes.json();

  return {
    galleries: data.records ?? []
  };
};
