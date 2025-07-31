// import AssemblyAI from 'assemblyai';
// import { Readable } from 'stream';
// import { NextResponse } from 'next/server';

// export async function POST(request: Request) {
//   try {
//     const client = new AssemblyAI({
//       apiKey: process.env.ASSEMBLYAI_API_KEY!,
//     });

//     const transcriber = client.streaming.transcriber({
//       sampleRate: 16_000,
//       formatTurns: true,
//     });

//     const { audioStream } = await request.json();

//     const transcription: string[] = [];

//     transcriber.on("turn", (turn: { transcript: string }) => {
//       if (turn.transcript) {
//         transcription.push(turn.transcript);
//       }
//     });

//     await transcriber.connect();

//     Readable.from(audioStream).pipe(transcriber.stream());

//     await new Promise((resolve) => {
//       transcriber.on("close", resolve);
//     });

//     return NextResponse.json({ transcription });
//   } catch (error) {
//     console.error("Error during transcription:", error as Error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }