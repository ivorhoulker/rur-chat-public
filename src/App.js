import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import "./App.css";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/analytics";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import reactStringReplace from "react-string-replace";

//TODO: Eagle, put your firebase stuff here:
firebase.initializeApp({
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
});

const auth = firebase.auth();
const firestore = firebase.firestore();
// const analytics = firebase.analytics();

function App() {
  const [user] = useAuthState(auth);
  const size = useWindowSize();
  useEffect(() => {
    if (!user) {
      auth.signInAnonymously();
    }
  });
  const [reachedBottom, setReachedBottom] = useState(false);
  const [scrolledOnce, setScrolledOnce] = useState(false);
  const scrollableDiv = useRef();
  const handleScroll = (e) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop - 80 <= e.target.clientHeight;
    setReachedBottom(bottom);
    if (!scrolledOnce) {
      setScrolledOnce(true);
    }
  };
  return (
    <div className="App" style={{ height: size.height }}>
      <header>
        <h1>{"Media & Space"}</h1>
        {user && (
          <img
            src={`https://my-adorable-avatars.df.r.appspot.com/avatar/23/${user.uid}`}
            alt="avatar"
          />
        )}
        {/* <SignOut /> */}
      </header>
      <section
        onScroll={handleScroll}
        ref={scrollableDiv}
        style={{ height: `${size.height - 128}px` }}
      >
        <ChatRoom
          scrolledOnce={scrolledOnce}
          reachedBottom={reachedBottom}
          key={user ? user.uid : 0}
          user={user || {}}
        />
      </section>
      <Form />
      {/* <section>{user ? <ChatRoom /> : <SignIn />}</section> */}
    </div>
  );
}

// function SignIn() {
//   const signInAnonymously = () => {
//     // const provider = new firebase.auth.GoogleAuthProvider();

//     // auth.signInWithPopup(provider);
//     auth.signInAnonymously();
//   };

//   return (
//     <>
//       <button className="sign-in" onClick={signInAnonymously}>
//         Sign in anonymously
//       </button>
//     </>
//   );
// }

// function SignOut() {
//   return (
//     auth.currentUser && (
//       <button className="sign-out" onClick={() => auth.signOut()}>
//         Sign Out
//       </button>
//     )
//   );
// }
const ChatRoom = ({ reachedBottom, scrolledOnce }) => {
  const ref = useRef();

  const messagesRef = firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(9999);

  const [messages] = useCollectionData(query, { idField: "id" });
  useLayoutEffect(() => {
    // console.log("reached bottom from chat", reachedBottom);
    if (!scrolledOnce || (messages && reachedBottom)) {
      ref.current.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [messages, reachedBottom, scrolledOnce]);

  return (
    <>
      <main>
        {messages &&
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <div style={{ height: "1px" }} ref={ref}></div>
        <div ref={ref}></div>
      </main>
    </>
  );
};

function Form() {
  const messagesRef = firestore.collection("messages");

  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
    });

    setFormValue("");
    // dummyRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          ref={(input) => input && input.focus()}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder=""
        />

        <button type="submit" disabled={!formValue}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </>
  );
}

const Urlify = ({ text }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return reactStringReplace(text, urlRegex, (match, i) =>
    match ? <a href={match}>{match}</a> : text
  );
};
function ChatMessage(props) {
  const { text, uid, createdAt } = props.message;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";
  const time =
    createdAt &&
    new Date(createdAt.toDate()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <>
      <div className={`message ${messageClass}`}>
        <img
          src={`https://my-adorable-avatars.df.r.appspot.com/avatar/23/${uid}`}
          alt="avatar"
        />

        <div className="message-text">
          <p>{<Urlify text={text} />}</p>
          <p>
            <small>{time}</small>
          </p>
        </div>
      </div>
    </>
  );
}
function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

export default App;
