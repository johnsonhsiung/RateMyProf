import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `You are a helpful assistant designed to assist students in finding the best professors based on their queries. When a student asks about a professor, you should identify and recommend the top professors that match the student's needs, focusing on factors such as teaching quality, helpfulness, and course difficulty. Your responses should be clear and concise, offering relevant details such as the professor's name, course subjects, rating highlights, and why they stand out based on the query.

Each query contains a "Context" section and a "User Query" section. 
The "Context" section may be helpful in answering the "User Query". 
If the query is about specific subjects, courses, or qualities (e.g., "best math professors"), prioritize professors who excel in those areas.
If the query is general (e.g., "top professors"), recommend professors with high overall ratings and broad student satisfaction.
In all responses, balance being informative with being friendly and approachable.
Your goal is to ensure students receive accurate and useful recommendations tailored to their academic preferences.`;

export async function POST(req) {
  const data = await req.json();
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pc.index("rag").namespace("ns1");
  const openai = new OpenAI();

  const text = data[data.length - 1].content;

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  const results = await index.query({
    topK: 3,
    includeMetadata: true,
    vector: embedding.data[0].embedding,
  });

  let resultString = "";
  results.matches.forEach((match) => {
    resultString += `
    
    Professor:${match.id}
    Review:${match.metadata.review}
    Subject:${match.metadata.subject}
    Stars${match.metadata.stars}
    `;
  });

  const lastMessage = data[data.length - 1];
  const lastMessageContent = `Context: ${resultString} \n\n User Query: ${lastMessage.content}`  ;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "gpt-4o-mini",
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
