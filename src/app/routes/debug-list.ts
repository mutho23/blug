// Run with: npx tsx debug-list.ts
import {AtpAgent} from '@atproto/api'
import * as dotenv from 'dotenv'
dotenv.config()

const agent = new AtpAgent({service: process.env.ATP_SERVICE!})
const repo = process.env.ATP_IDENTIFIER!

async function main() {
  console.log('ATP_SERVICE:', process.env.ATP_SERVICE)
  console.log('ATP_IDENTIFIER:', repo)
  console.log('')

  // 1. Check social.popfeed.feed.listItem
  console.log('=== social.popfeed.feed.listItem ===')
  try {
    const res = await agent.com.atproto.repo.listRecords({
      collection: 'social.popfeed.feed.listItem',
      repo,
      limit: 5,
    })
    console.log('success:', res.success)
    console.log('count:', res.data?.records?.length)
    if (res.data?.records?.length > 0) {
      console.log('SAMPLE RECORD:', JSON.stringify(res.data.records[0], null, 2))
    }
  } catch (e) {
    console.log('ERROR:', e)
  }

  console.log('')

  // 2. Check social.popfeed.feed.list
  console.log('=== social.popfeed.feed.list ===')
  try {
    const res = await agent.com.atproto.repo.listRecords({
      collection: 'social.popfeed.feed.list',
      repo,
      limit: 10,
    })
    console.log('success:', res.success)
    console.log('count:', res.data?.records?.length)
    res.data?.records?.forEach(r => {
      console.log('LIST URI:', r.uri)
      console.log('LIST VALUE:', JSON.stringify(r.value, null, 2))
    })
  } catch (e) {
    console.log('ERROR:', e)
  }
}

main()
