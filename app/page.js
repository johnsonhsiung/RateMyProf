"use client";
import RenderResult from "next/dist/server/render-result";
import { useState, useRef, useEffect } from "react";
import { Box, TextField, Button, Stack, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import {} from "@mui/material";

export default function Home() {
  const DotAnimation = () => {
    return (
      <Box
        component="span"
        sx={{
          fontSize: "20px",
          "& span": {
            display: "inline-block",
            animation: "dot-blink 1.5s infinite ease-in-out both",
          },
          "& span:nth-of-type(1)": {
            animationDelay: "0s",
          },
          "& span:nth-of-type(2)": {
            animationDelay: "0.3s",
          },
          "& span:nth-of-type(3)": {
            animationDelay: "0.6s",
          },
          "@keyframes dot-blink": {
            "0%": { opacity: 0 },
            "50%": { opacity: 1 },
            "100%": { opacity: 0 },
          },
        }}
      >
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </Box>
    );
  };
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Rate My Professor support asssistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");

  const stackRef = useRef(null);

  useEffect(() => {
    // Everytime messages is updatead, get the stack displaying messages and scroll to the bottom.
    const stackElement = stackRef.current;
    if (stackElement) {
      stackElement.scrollTop = stackElement.scrollHeight;
    }
  }, [messages]);

  // Use functional states when your current state depends on a previous state. Otherwise, because react may not render the component immediately, some updates might be lost.
  const sendMessage = async () => {
    if (!message) {
      console.log("Message is empty, exiting function");
      return;
    }
    console.log(`sending ${message}`);
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
    <Box width="100vw" height="100vh" display="flex" flexDirection="row">
      <Box
        flex="1 1 25%"
        bgcolor="black"
        display="flex"
        flexDirection="column"
        alignContent="center"
      >
        <Box>
          <Typography
            variant="h4"
            color="white"
            align="center"
            margin={"24px"}
            fontWeight="bold"
          >
            RAG Professor Chatbot
          </Typography>
        </Box>
        <Divider variant="middle" sx={{ bgcolor: "white" }} />
        <Box>
          <Typography variant="h6" color="white" align="left" margin={"32px"}>
            Welcome to RAG Professor Chatbot. This chatbot uses OpenAI
            embeddings to search a Pinecone database filled with dummy professor
            data inserted with Python. Some sample questions you can ask: <br />{" "}
            <br />
            Who teaches Linear Algebra? <br /> <br />
            Who is Dr. Emily Carter? <br /> <br />
            What classes are there for computer science? <br /> <br /> <br />
          </Typography>
        </Box>
        <Divider variant="middle" sx={{ bgcolor: "white" }} />
        <Box height="300px">
          <Typography variant="h6" color="white" align="left" margin={"32px"}>
            Check out the&nbsp;
            <Link
              href="https://github.com/johnsonhsiung/RateMyProf"
              component="span"
            >
              source code
            </Link>
            &nbsp;for more details!
          </Typography>
        </Box>
      </Box>

      <Stack
        direction="column"
        flex="1 1 75%"
        p={2}
        spacing={3}
        sx={{
          background: "rgb(0,0,0)",
          background:
            "linear-gradient(112deg, #2980b9 0%, #6dd5fa 50%, #ffffff 100%)",
            

        }}
      >
        <Stack
          ref={stackRef}
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
          sx={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
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
                bgcolor={message.role === "assistant" ? "white" : "#e0e0e0"}
                color="black"
                borderRadius={8}
                sx={{
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                  border: "1px solid rgba(255, 255, 255, .2)",
                }}
                p={3}
              >
                {message.content !== "" ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <DotAnimation></DotAnimation>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            sx={{
              color: "white",
              "& .MuiOutlinedInput-root": {
                borderRadius: "100px",
                "& fieldset": {
                  borderRadius: "100px", // Ensuring fieldset also has the same border-radius
                  borderColor: "white",
                },
                "&:hover": {
                  "& fieldset": {
                    borderColor: "white",
                  },
                },
                "&.Mui-focused fieldset": {
                  borderColor: "white", // Highlight white when active (focused)
                },
                "& input": {
                  color: "white", // Text color inside the input when typing
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)", // Default label color
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "white", // Label color when active (focused)
              },
              "&:hover .MuiInputLabel-root": {
                color: "white", // Label color on hover
              },
            }}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          ></TextField>
          <IconButton
            sx={{ color: "white" }}
            aria-label="send"
            onClick={sendMessage}
          >
            <ArrowUpwardIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
