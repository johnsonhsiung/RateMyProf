"use client";
import RenderResult from "next/dist/server/render-result";
import { useState } from "react";
import { Box, TextField, Button, Stack } from "@mui/material";
import ReactMarkdown from "react-markdown";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import IconButton from '@mui/material/IconButton';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Rate My Professor support asssistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  // Use functional states when your current state depends on a previous state. Otherwise, because react may not render the component immediately, some updates might be lost. 
  const sendMessage = async () => {
    if (!message) {
      console.log('Message is empty, exiting function');
      return; 
    }
    console.log(`sending ${message}`)
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);
    setMessage("");
  
    const response = fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = "";
      // reader.read() returns a promise that resolves as done (boolean for if stream is finished) and value (Uint8Array - current chunk of data)
      // function processText is a named anonymous function that takes in an object. 
      // we destructure the promise object from reader.read() into two variables done and value 
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        // value might be null or undefined due to issues in the stream or network, so need a fallback mechanism so the code doesn't break. 
        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });

        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);

          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
        // recursively call for the next chunk of data
        return reader.read().then(processText);
      });
    });
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents the default action (like a newline)
      sendMessage();
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction="column"
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                bgcolor={
                  message.role === "assistant"
                    ? "primary.main"
                    : "secondary.main"
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          ></TextField>
         <IconButton color="primary" aria-label="send" onClick={sendMessage}>
            <ArrowUpwardIcon/>
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
