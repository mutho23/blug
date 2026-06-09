import {json} from '@remix-run/node'

export const loader = async () => {
  const repo = process.env.ATP_IDENTIFIER!
  const service = process.env.ATP_SERVICE!

  const listItem = await fetch(
    `${service}/xrpc/com.atproto.repo.listRecords?repo=${repo}&collection=social.popfeed.feed.listItem&limit=5`
  ).then(r => r.json()).catch(e => ({error: String(e)}))

  const list = await fetch(
    `${service}/xrpc/com.atproto.repo.listRecords?repo=${repo}&collection=social.popfeed.feed.list&limit=10`
  ).then(r => r.json()).catch(e => ({error: String(e)}))

  return json({
    repo,
    service,
    listItem,
    list,
  })
}

export default function DebugList() {
  return null
}
