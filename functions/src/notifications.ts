import { getMessaging } from "firebase-admin/messaging"

export async function sendToTokens(params: {
  tokens: string[]
  title: string
  body: string
  data?: Record<string, string>
}) {
  const tokens = (params.tokens || []).filter(Boolean)
  if (tokens.length === 0) return
  await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title: params.title, body: params.body },
    data: params.data,
  })
}

export async function sendToTopic(params: {
  topic: string
  title: string
  body: string
  data?: Record<string, string>
}) {
  await getMessaging().send({
    topic: params.topic,
    notification: { title: params.title, body: params.body },
    data: params.data,
  })
}
