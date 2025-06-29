import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, arrayUnion, serverTimestamp, getDocs, deleteField, increment } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || '{}');
const appId = process.env.REACT_APP_ID || 'default-app-id';

// Initialize Firebase outside the component to avoid re-initialization
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Pre-defined game data
const PROMPT_CARDS = {
    "Red Flag or Relationship Goals?": [], // This will now be dynamically generated
};

const ANSWER_CARDS = [
    "a pet rock named 'Gary'", "my extensive collection of toenail clippings", "the concept of personal hygiene",
    "a five-hour interpretive dance", "my imaginary friend, Bartholomew", "the meaning of life, according to a squirrel",
    "their ex's entire family tree", "a spontaneous trip to the moon", "a heated debate about flat earth theories",
    "my obsession with competitive eating", "the ghost of my past relationship", "a really bad karaoke performance",
    "a detailed PowerPoint presentation on my insecurities", "my unique collection of lint", "a crying baby simulator",
    "the sound of a kazoo orchestra", "their unedited diary entries from middle school", "a sock puppet show",
    "the recipe for my grandma's infamous fruitcake", "a detailed analysis of my dream journal", "their pet goldfish",
    "a surprise visit from a mariachi band", "a 30-page manifesto on why cats are superior to dogs", "my crippling fear of ducks",
    "a life-sized cardboard cutout of myself", "the exact moment I realized I was allergic to gluten", "my collection of antique staplers",
    "a detailed explanation of quantum physics", "their personal alien abduction story", "a single, lonely potato",
    "the dark secrets of my childhood treehouse", "my profound love for glitter", "a dramatic re-enactment of my last dentist visit",
    "a squirrel dressed as a tiny chef", "my secret talent for burping the alphabet backwards", "a miniature alpaca farm",
    "the lingering smell of old gym socks", "my deep philosophical thoughts on cheese", "a very aggressive snail",
    "a conspiracy theory involving garden gnomes", "my questionable fashion choices from the 90s", "the universal language of farts",
    "a spontaneous opera performance", "my collection of rare, vintage sporks", "the exact number of hairs on my head",
    "a detailed map of my internal organs", "my uncanny ability to predict the weather with my knee", "a flock of angry pigeons",
    "my personal brand of awkward silence", "a very confused mime", "the entire script of a terrible B-movie",
    "a deep dive into celebrity gossip from 2003", "my most embarrassing childhood story, told in interpretive dance", "a rogue tumbleweed",
    "my collection of forgotten dreams", "a perpetually confused stare", "the subtle art of passive aggression",
    "a commitment to never folding laundry again", "the true identity of Santa Claus", "a never-ending loop of elevator music",
    "my inability to tell left from right", "a lifetime supply of questionable advice", "the secret to perfect toast",
    "a spontaneous act of kindness towards a pigeon", "my irrational fear of balloons", "a detailed budget of my impulse purchases",
    "the surprising history of garden hoses", "my unwavering dedication to napping", "a profound appreciation for mundane objects",
    "my personal record for most consecutive sneezes", "a hidden talent for imitating barnyard animals", "the shocking truth about socks",
    "my unwavering belief in unicorns", "a detailed analysis of my coffee preferences", "the silent language of eyebrow raises",
    "a deep philosophical debate about condiments", "my surprising expertise in competitive napping", "the existential dread of a Monday morning",
    "a profound understanding of cat psychology", "my secret stash of emergency chocolate", "the art of graceful awkwardness",
    "a detailed plan for world domination (starting with my pantry)", "my most cherished collection of bottle caps", "the subtle nuances of air guitar",
    "a profound appreciation for bad puns", "my impressive ability to procrastinate creatively", "the surprising comfort of mismatched socks",
    "a detailed study of dust bunnies", "my personal philosophy on the optimal way to butter toast", "the quiet rebellion of untamed hair",
    "a deep contemplation of the universe while staring at a ceiling fan", "my unwavering commitment to collecting novelty erasers", "the dramatic flair of a well-timed eye-roll"
];

const RED_FLAG_TITLES = {
    0: { title: "Soulmate Status/ Certified Lover", description: "Congratulations! You are pure relationship gold. Smooth sailing, good vibes, and probably a waiting list for dates." },
    10: { title: "Almost Perfect / Just a Vibe", description: "A few tiny quirks, but nothing a little communication can't handle. You're basically custom-ordered for a healthy partnership." },
    20: { title: "The Minor Tune-Up / Good to Go, Mostly", description: "You've got some minor glitches, but nothing that derails the whole operation. A little self-awareness and effort, and you're golden." },
    30: { title: "The 'Work In Progress' / Relationship Project", description: "Okay, we see some areas for improvement. You're still worth the effort, but don't forget the manual for emotional intelligence." },
    40: { title: "Proceed with Caution / Yellow Light", description: "The warning signs are starting to flash. There's potential, but someone's gonna need a hard hat and a lot of patience to build something solid here." },
    50: { title: "Flip a Coin/ Mixed Bag", description: "You're a true enigma. Half a dream, half a nightmare. This relationship is gonna keep everyone guessing. Strap in!" },
    60: { title: "Danger Zone / Enter at Your Own Risk", description: "The red flags are starting to outnumber the green ones. This connection might come with more drama than a reality TV show." },
    70: { title: "High Maintenance, Low Reward / The Tempting Trap", description: "Oh, you're charismatic alright, but behind that charm, there are some serious issues lurking. It's like a beautiful car with no brakes." },
    80: { title: "Warning Sign Warrior / Full Steam Ahead to Chaos", description: "You're not just waving red flags; you've got a whole parade of them. This relationship needs a professional, or an escape plan." },
    90: { title: "RUN! / Evacuate Immediately", description: "This isn't dating; it's an extreme sport. Every interaction is a potential landmine. Get out. Now." },
    100: { title: "The Walking Red Flag / Relationship Kryptonite", description: "You are the embodiment of every cautionary tale. A master class in 'what not to do.' Stay far, far away for everyone's safety." }
};

// Rename KRIYA_ADS to POPUP_ADS
const POPUP_ADS = [
    {
        title: "Kriya Botanicals - Nourish Your Roots!",
        image: "https://scontent-mia3-1.xx.fbcdn.net/v/t39.30808-6/473014145_1022672133212383_7455427243637921771_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=xDgn4zdguJIQ7kNvwGKd2EK&_nc_oc=AdlKTmywN5e6dNvjc-yH_7PTAt12RPrNgqKMqLvT7dmfz0T0vyMRNeNVJwVjvxCroYw&_nc_zt=23&_nc_ht=scontent-mia3-1.xx&_nc_gid=1g-FyU6O3VDFy1DvpHwpIQ&oh=00_AfO1xUz6MGVrsMqNnc2j7dDQbCK7_5gHvU5ea6G2gWpHUA&oe=685F16E9", // Example placeholder
        description: "Experience the power of nature with Kriya Botanicals natural hair products. Hydrate, strengthen, and shine—naturally! Try our best-selling leave-in conditioner today."
    },
    {
        title: "Kriya Botanicals - Curls That Wow!",
        image: "https://scontent-mia3-1.xx.fbcdn.net/v/t39.30808-6/486493494_10161139828952543_6107835121073011412_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=833d8c&_nc_ohc=Tq5GlDW58V0Q7kNvwE80yCw&_nc_oc=Adli1caSZyzmwB3bfqDa3P5OWq2NZ6vLvvpDSdiuat-BjOWQ5a75T0YB75z8GwuIO0E&_nc_zt=23&_nc_ht=scontent-mia3-1.xx&_nc_gid=4KS3SwcRA5uIpc_UOm_AIw&oh=00_AfOFchd-nFXsXQjFWqG4XUI5190aEb7tKHfCFMRQEYBgog&oe=685F49EA",
        description: "Unleash your curls with Kriya Botanicals. Our botanical blends define, detangle, and dazzle. Because your hair deserves the best!"
    },
    {
        title: "Kriya Botanicals - Pure, Plant-Powered Beauty!",
        image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80https://scontent-mia3-3.xx.fbcdn.net/v/t39.30808-6/470148513_18467575291005150_3673084829007527660_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=UmuJoiF97esQ7kNvwHfL6Nj&_nc_oc=AdnjIysxZXN4E67SZMhW5Rh9rhW5fo5Q775XdrvXbhmCkAf0odlt5EZ3Nz12_L-VlmI&_nc_zt=23&_nc_ht=scontent-mia3-3.xx&_nc_gid=OavS8Zp0_-Z8vECDAJM5XQ&oh=00_AfMi6EA_D2JZLiWekipC6JII-fplbOXpldIS2Fdmb-NpFQ&oe=685F272E",
        description: "Go green with your routine! Kriya Botanicals uses only the purest plant ingredients for healthy, happy hair. Discover your new favorite today."
    }
];

// Main App Component
function App() {
    const [userId, setUserId] = useState(null);
    const [currentPage, setCurrentPage] = useState('home');
    const [gameId, setGameId] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    // Define isHost at the top level so it's available in all handlers
    const isHost = gameData && gameData.hostId === userId;

    // Move generateRedFlagQuestion to App scope so it's available everywhere
    const generateRedFlagQuestion = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/generate-red-flag-question', {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to generate question');
            return await response.json();
        } catch (error) {
            console.error('AI backend failed, using fallback question:', error);
            // Fallback question and choices
            return {
                type: 'scenario_vote',
                text: "Your partner insists on bringing their pet iguana to every date. What's your move?",
                choices: {
                    a: "That's a dealbreaker. I'm not sharing my fries with a lizard.",
                    b: "Honestly, that's kind of awesome. Can I get it a tiny hat?",
                    c: "I have so many questions, but I'm here for the chaos.",
                    d: "As long as the iguana doesn't judge my karaoke, we're good."
                },
                pillar: "Relationship Riddles"
            };
        }
    };

    // Auth state listener and initial sign-in logic
    useEffect(() => {
        const SESSION_USER_ID_KEY = 'redFlagsGameTempUserId';

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            const initialAuthToken = process.env.REACT_APP_INITIAL_AUTH_TOKEN;
            if (initialAuthToken) {
                // If an initial auth token is provided (e.g., from the Canvas environment)
                // Use Firebase authentication with the provided token.
                if (!currentUser) {
                    try {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } catch (error) {
                        console.error("Firebase Auth Error with custom token:", error);
                        showMessage(`Authentication failed: ${error.message}. Please refresh.`);
                    }
                }
                // Once authenticated, set the user and their UID from Firebase.
                if (auth.currentUser) {
                    setUserId(auth.currentUser.uid);
                    // Set default player name if not already set, or load from storage
                    if (!playerName) {
                        setPlayerName(`Player ${auth.currentUser.uid.substring(0, 4)}`);
                    }
                }
            } else {
                // If no initial auth token (e.g., in a standalone browser tab for testing)
                // Generate and use a temporary, session-based user ID.
                let tempUserId = sessionStorage.getItem(SESSION_USER_ID_KEY);
                if (!tempUserId) {
                    tempUserId = `guest_${crypto.randomUUID()}`; // Generate a unique ID
                    sessionStorage.setItem(SESSION_USER_ID_KEY, tempUserId);
                    console.log("Generated new session userId:", tempUserId);
                } else {
                    console.log("Reusing session userId:", tempUserId);
                }

                setUserId(tempUserId); // Use the session ID as the userId
                // Set default player name for guest
                if (!playerName) {
                    setPlayerName(`Player ${tempUserId.substring(0, 5)}`);
                }
            }
            setIsAuthReady(true); // Auth listener has completed its initial check or temp ID is set
        });
        return () => unsubscribe();
    }, [playerName]); // Added playerName to dependencies to prevent re-rendering issues

    // Firebase game data listener
    useEffect(() => {
        if (!gameId || !isAuthReady || !userId) return; // Ensure auth and user are ready

        const gameDocRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
        const unsubscribeGame = onSnapshot(gameDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const newData = { id: docSnap.id, ...docSnap.data() };

                // Use functional update to compare with previous state without causing re-subscription
                setGameData(prevData => {
                    // If a new image judgment prompt was just set by the host, generate the image
                    if (
                        userId === newData.hostId &&
                        newData.status === 'submission' &&
                        newData.prompts[newData.currentRound - 1]?.type === 'image_judgment' &&
                        !newData.prompts[newData.currentRound - 1]?.imageUrl &&
                        (prevData?.currentRound !== newData.currentRound || prevData?.status !== 'submission')
                    ) {
                        setIsLoadingImage(true);
                        generateImageForPrompt(newData.prompts[newData.currentRound - 1].ai_prompt_description).then(imageUrl => {
                            updateDoc(gameDocRef, {
                                [`prompts.${newData.currentRound - 1}.imageUrl`]: imageUrl,
                                isLoadingImage: false
                            });
                            setIsLoadingImage(false);
                        });
                    }
                    return newData; // Update the state with the new data
                });

                // Navigate based on game status
                if (newData.status === 'submission' || newData.status === 'voting') {
                    setCurrentPage('game');
                } else if (newData.status === 'round_end') {
                    setCurrentPage('leaderboard');
                } else if (newData.status === 'game_over') {
                    setCurrentPage('winner');
                } else if (newData.status === 'lobby') {
                    setCurrentPage('lobby');
                }
            } else {
                console.error("Game document does not exist!");
                setGameId(null);
                setGameData(null);
                setCurrentPage('home');
                showMessage("The game you were in no longer exists.");
            }
        });

        return () => unsubscribeGame();
    }, [gameId, isAuthReady, userId]); // Correct dependency array, removed gameData

    // Utility to generate image (placeholder)
    const generateImageForPrompt = async (promptDescription) => {
        console.log("Starting image generation for:", promptDescription);
        // This is a placeholder. In a real app, you would call your AI image model here.
        // For now, we return a static placeholder image URL after a short delay.
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        const placeholderUrl = `https://via.placeholder.com/400x300.png?text=${encodeURIComponent(promptDescription.substring(0, 30))}`;
        console.log("Generated image URL:", placeholderUrl);
        return placeholderUrl;
    };

    const showMessage = (msg) => {
        // Implement a user notification system here if needed, e.g., toast or alert
        alert(msg); // Simple fallback for now
    };

    const handleNextRound = async () => {
        if (!isHost) return;

        try {
            const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
            const nextRound = gameData.currentRound + 1;

            // Always transition to winner if at or past maxRounds
            if (nextRound > gameData.maxRounds || gameData.currentRound >= gameData.maxRounds) {
                await updateDoc(gameRef, { status: 'winner' });
                return;
            }

            let promptHistory = gameData.promptHistory || [];

            let finalPrompt;
            if (gameData.category === "Red Flag or Relationship Goals?") {
                // For this mode, prompts are pre-generated. Just get the next one.
                finalPrompt = gameData.prompts[nextRound - 1];
                if (!finalPrompt) {
                    console.error("Could not find the next prompt for Red Flag mode.");
                    await updateDoc(gameRef, { status: 'winner' });
                    return;
                }
            } else {
                // For other modes, generate a new prompt dynamically
                const promptCardsForCategory = PROMPT_CARDS[gameData.category] || [];
                if (promptCardsForCategory.length === 0) {
                    showMessage("No prompts available for this category.");
                    return;
                }
                finalPrompt = getRandomPrompt(promptCardsForCategory, promptHistory);
                promptHistory = [...promptHistory, finalPrompt.text];
            }

            // Reset player states for the new round
            const updatedPlayers = {};
            let availableCards = [...ANSWER_CARDS]; // For replenishment logic (only used for Red Flag/Looks Like)

            for (const pId in gameData.players) {
                const player = gameData.players[pId];
                let currentHand = player.hand || [];
                // Only replenish hands for Red Flag or Relationship Goals, Looks Like, and Love, Laugh, or Leave?
                if (
                    gameData.category === "Red Flag or Relationship Goals" ||
                    gameData.category === "Looks Like"
                ) {
                    const cardsNeeded = 10 - currentHand.length;
                    if (cardsNeeded > 0) {
                        const shuffledDeck = shuffleArray([...availableCards]);
                        const newCards = shuffledDeck.slice(0, cardsNeeded);
                        currentHand.push(...newCards);
                    }
                }
                // For all other categories, do NOT replenish hand
                updatedPlayers[pId] = {
                    ...player,
                    hand: currentHand,
                    hasSubmitted: false,
                    hasVoted: false
                };
            }

            const updatePayload = {
                status: 'submission',
                currentRound: nextRound,
                players: updatedPlayers,
                submittedAnswers: {},
                playerChoices: {},
                votes: {},
                roundResults: deleteField(),
                currentWinningSubmission: null,
                isLoadingImage: finalPrompt.type === 'image_judgment'
            };

            // Only update prompts if they are not pre-loaded
            if (gameData.category !== "Red Flag or Relationship Goals") {
                updatePayload.prompts = [...gameData.prompts, finalPrompt];
                updatePayload.promptHistory = promptHistory;
            }

            await updateDoc(gameRef, updatePayload);
        } catch (error) {
            console.error("Error advancing round:", error);
            showMessage(`Error advancing round: ${error.message}`);
        }
    };

    const handlePlayAgain = async () => {
        if (gameData.hostId !== userId) {
            showMessage("Only the host can start a new game.");
            return;
        }

        try {
            const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
            
            // Reset player states
            const resetPlayers = { ...gameData.players };
            for (const pId in resetPlayers) {
                resetPlayers[pId] = {
                    ...resetPlayers[pId],
                    score: 0,
                    hand: [],
                    hasSubmitted: false,
                    hasVoted: false,
                    totalHearts: 0,
                    totalRedFlags: 0,
                };
            }

            await updateDoc(gameRef, {
                status: 'lobby',
                currentRound: 0,
                maxRounds: 10,
                prompts: [],
                promptHistory: [],
                submittedAnswers: {},
                playerChoices: {},
                votes: {},
                roundResults: deleteField(),
                currentWinningSubmission: null,
                isLoadingImage: false,
                players: resetPlayers,
                category: 'Red Flag or Relationship Goals?'
            });
            // The onSnapshot listener will automatically handle the page transition to 'lobby'
        } catch (error) {
            console.error("Error restarting game:", error);
            showMessage("Failed to restart the game.");
        }
    };

    // Room code display (top left)
    const renderRoomCode = () => {
        if (gameData && gameData.gameCode) {
            return (
                <div className="fixed top-2 left-2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50">
                    Room Code: {gameData.gameCode}
                </div>
            );
        }
        return null;
    };

    // Render logic based on currentPage
    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage setCurrentPage={setCurrentPage} setGameId={setGameId} userId={userId} showMessage={showMessage} playerName={playerName} setPlayerName={setPlayerName} />;
            case 'lobby':
                return <LobbyPage gameData={gameData} gameId={gameId} userId={userId} showMessage={showMessage} generateRedFlagQuestion={generateRedFlagQuestion} isHost={isHost} />;
            case 'game':
                return <GamePage gameData={gameData} gameId={gameId} userId={userId} showMessage={showMessage} isLoadingImage={isLoadingImage} />; // Pass isLoadingImage
            case 'leaderboard':
                return <LeaderboardPage gameData={gameData} userId={userId} gameId={gameId} showMessage={showMessage} handleNextRound={handleNextRound} />; // Adjusted to use updated handleNextRound via prop
            case 'winner':
                return <WinnerPage gameData={gameData} userId={userId} onPlayAgain={handlePlayAgain} showMessage={showMessage} />; // Pass showMessage for modal
            default:
                return <HomePage setCurrentPage={setCurrentPage} setGameId={setGameId} userId={userId} showMessage={showMessage} playerName={playerName} setPlayerName={setPlayerName} />;
        }
    };

    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-pink-600 to-red-500 text-white font-inter">
                <p className="text-3xl animate-pulse">Loading game...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-800 via-pink-600 to-red-500 text-white font-inter flex flex-col items-center justify-center p-4 relative">
            {renderRoomCode()}
            {/* Game/category name at the top, except on Player Profile */}
            {currentPage !== 'profile' && (
                <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-8 drop-shadow-lg leading-tight">
                    {gameData && gameData.category ? gameData.category : 'Red Flags or Relationship Goals?'}
                </h1>
            )}
            {renderPage()}
        </div>
    );
}

// HomePage Component
const HomePage = ({ setCurrentPage, setGameId, userId, showMessage, playerName, setPlayerName }) => {
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateGame = async (category) => {
        if (!playerName.trim()) {
            showMessage("Please enter your nickname.");
            return;
        }
        setIsLoading(true);
        try {
            const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const initialPlayers = {};
            initialPlayers[userId] = {
                id: userId,
                name: playerName.trim(),
                score: 0,
                isHost: true,
                hand: [],
                hasSubmitted: false,
                hasVoted: false,
                totalRedFlags: 0,
                totalHearts: 0
            };
            const initialGameData = {
                hostId: userId,
                currentRound: 0,
                status: 'lobby',
                players: initialPlayers,
                gameCode: gameCode,
                createdAt: serverTimestamp(),
                category: category
            };
            initialGameData.prompts = [];
            initialGameData.promptHistory = [];
            initialGameData.submittedAnswers = {};
            initialGameData.playerChoices = {};
            initialGameData.votes = {};
            initialGameData.roundResults = {};
            initialGameData.currentWinningSubmission = null;
            initialGameData.isLoadingImage = false;
            const newGameRef = await addDoc(collection(db, `artifacts/${appId}/public/data/games`), initialGameData);
            setGameId(newGameRef.id);
            setCurrentPage('lobby');
        } catch (error) {
            console.error("Error creating game:", error);
            showMessage("Failed to create game. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinGame = async () => {
        if (!playerName.trim()) {
            showMessage("Please enter your nickname.");
            return;
        }
        if (!joinCode) {
            showMessage("Please enter a game code.");
            return;
        }
        setIsLoading(true);
        try {
            const q = query(collection(db, `artifacts/${appId}/public/data/games`), where("gameCode", "==", joinCode.toUpperCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const gameDoc = querySnapshot.docs[0];
                const gameData = gameDoc.data();
                const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameDoc.id);
                if (gameData.players[userId]) {
                    showMessage("You are already in this game.");
                    if (gameData.status === 'submission' || gameData.status === 'voting') {
                        setCurrentPage('game');
                    } else if (gameData.status === 'round_end') {
                        setCurrentPage('leaderboard');
                    } else if (gameData.status === 'game_over') {
                        setCurrentPage('winner');
                    } else {
                        setCurrentPage('lobby');
                    }
                    setGameId(gameDoc.id);
                    return;
                }
                const playerHand = shuffleArray([...ANSWER_CARDS]).slice(0, 10);
                await updateDoc(gameRef, {
                    [`players.${userId}`]: {
                        id: userId,
                        name: playerName.trim(),
                        score: 0,
                        isHost: false,
                        hand: playerHand,
                        hasSubmitted: false,
                        hasVoted: false,
                        totalRedFlags: 0,
                        totalHearts: 0
                    }
                });
                setGameId(gameDoc.id);
                if (gameData.status === 'submission' || gameData.status === 'voting') {
                    setCurrentPage('game');
                } else if (gameData.status === 'round_end') {
                    setCurrentPage('leaderboard');
                } else if (gameData.status === 'game_over') {
                    setCurrentPage('winner');
                } else {
                    setCurrentPage('lobby');
                }
            } else {
                showMessage("Invalid game code.");
            }
        } catch (error) {
            console.error("Error joining game:", error);
            showMessage("Failed to join game. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <input
                type="text"
                placeholder="Enter your nickname"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full max-w-xs p-3 rounded-xl bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-6 text-center"
                maxLength="20"
            />
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div
                    className="bg-white bg-opacity-20 rounded-xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:bg-opacity-40 transition w-72"
                >
                    <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80" alt="Red Flag or Relationship Goals?" className="w-48 h-64 object-cover rounded-lg mb-2" />
                    <p className="text-white text-center mt-2 mb-4">Vote on hilarious relationship scenarios. Who's waving a red flag?</p>
                    <button
                        onClick={() => handleCreateGame('Red Flag or Relationship Goals?')}
                        className="w-full bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                        disabled={!playerName.trim() || isLoading}
                    >
                        Create Game
                    </button>
                </div>
            </div>
            <div className="flex flex-col items-center w-full max-w-xs">
                <div className="flex items-center w-full mb-2">
                    <div className="flex-grow border-t border-gray-400"></div>
                    <span className="mx-2 text-gray-300">OR</span>
                    <div className="flex-grow border-t border-gray-400"></div>
                </div>
                <input
                    type="text"
                    placeholder="Enter Game Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white bg-opacity-20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3 text-center uppercase"
                    maxLength="6"
                />
                <button
                    onClick={handleJoinGame}
                    className="w-full bg-gradient-to-r from-green-500 to-lime-400 hover:from-green-600 hover:to-lime-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                    disabled={!playerName.trim() || !joinCode.trim() || isLoading}
                >
                    Join Game
                </button>
            </div>
        </div>
    );
};

// LobbyPage Component
const LobbyPage = ({ gameData, gameId, userId, showMessage, generateRedFlagQuestion, isHost }) => {
    // Move useState to the top
    const [isGenerating, setIsGenerating] = useState(false);

    // Add a more specific check to ensure gameData and its nested properties are loaded
    if (!gameData || !gameData.hostId || !gameData.players) {
        return <p className="text-center text-xl text-gray-200 animate-pulse">Loading lobby...</p>;
    }

    const playersInLobby = Object.values(gameData.players).sort((a, b) => a.name.localeCompare(b.name));

    const handleStartGame = async () => {
        if (!isHost) return;

        const playersInGame = Object.values(gameData.players);
        if (playersInGame.length < 1) {
            showMessage("You need at least 1 player to start the game.");
            return;
        }

        setIsGenerating(true);
        try {
            const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);

            // --- RED FLAG OR RELATIONSHIP GOALS? ---
            if (gameData.category === "Red Flag or Relationship Goals?") {
                let finalPrompts = [];
                for (let i = 0; i < 10; i++) {
                    const newPrompt = await generateRedFlagQuestion();
                    finalPrompts.push(newPrompt);
                }
                // Deal hands to all players
                let updatedPlayers = { ...gameData.players };
                Object.keys(updatedPlayers).forEach(pid => {
                    try {
                        updatedPlayers[pid] = {
                            ...updatedPlayers[pid],
                            hand: shuffleArray([...ANSWER_CARDS]).slice(0, 10),
                            hasSubmitted: false,
                            hasVoted: false
                        };
                    } catch (err) {
                        console.error('Error dealing hand to player', pid, err);
                    }
                });
                try {
                    await updateDoc(gameRef, {
                        status: 'submission',
                        currentRound: 1,
                        prompts: finalPrompts,
                        maxRounds: finalPrompts.length,
                        players: updatedPlayers
                    });
                } catch (err) {
                    console.error('Error updating game for Red Flag start', err);
                    showMessage('Error starting game. Please try again.');
                }
                setIsGenerating(false);
                return;
            }

            showMessage("Unknown category.");
        } catch (error) {
            showMessage("An error occurred while starting the game.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="text-center p-4">
            <h2 className="text-4xl font-bold mb-4 text-white">Game Lobby</h2>
            <p className="text-xl text-gray-200 mb-6">
                Game Code: <span className="font-bold text-yellow-300">{gameData.gameCode}</span>
            </p>
            <div className="text-lg text-gray-200 mb-2 flex items-center justify-center">
                <span className="mr-2">Category:</span>
                <span className="font-semibold text-pink-200">{gameData.category}</span>
            </div>
            <p className="text-lg text-gray-200 mb-4">Players Connected:</p>
            <ul className="list-disc list-inside text-left mx-auto max-w-xs mb-8 text-gray-100">
                {playersInLobby.map(player => (
                    <li key={player.id} className="py-1">
                        {player.name} {player.isHost && "(Host)"}
                    </li>
                ))}
            </ul>
            {isHost && (
                <div className="mt-6">
                    {isGenerating ? (
                        <div className="text-center">
                            <p className="text-2xl text-white animate-pulse">We are generating hilarious and problematic scenarios...</p>
                            <p className="text-gray-400 mt-2">This might take a moment.</p>
                        </div>
                    ) : (
                        <button
                            onClick={handleStartGame}
                            disabled={!isHost || playersInLobby.length < 1}
                            className="w-full bg-gradient-to-r from-green-500 to-lime-400 hover:from-green-600 hover:to-lime-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Game
                        </button>
                    )}
                </div>
            )}
            {!isHost && (
                <p className="text-xl text-gray-300 italic">Waiting for host to start the game!</p>
            )}
        </div>
    );
};

// GamePage Component
const GamePage = ({ gameData, gameId, userId, showMessage, isLoadingImage }) => {
    const currentPrompt = getCurrentPrompt(gameData);
    if (!currentPrompt) {
        return <p className="text-center text-xl text-gray-200">Waiting for question...</p>;
    }

    // --- RED FLAG OR RELATIONSHIP GOALS? ---
    // Define all required variables for this block
    const player = gameData.players[userId];
    const hasSubmitted = player?.hasSubmitted;
    const allSubmitted = Object.values(gameData.players).every(p => p.hasSubmitted);
    const submittedAnswers = gameData.submittedAnswers || {};
    const votes = gameData.votes || {};

    // Submission phase: pick one of the 4 choices
    const handleSubmitChoice = async (choiceKey) => {
        try {
            const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
            await updateDoc(gameRef, {
                [`submittedAnswers.${userId}`]: { choiceKey, playerId: userId },
                [`players.${userId}.hasSubmitted`]: true,
            });
        } catch (err) {
            console.error('Error submitting answer:', err);
            showMessage('Error submitting answer.');
        }
    };

    // Voting handler (heart or red flag)
    const handleVote = async (answerId, type) => {
        try {
            const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
            const votePath = `votes.${answerId}.${type}`;
            await updateDoc(gameRef, {
                [votePath]: arrayUnion(userId),
            });
        } catch (err) {
            console.error('Error voting:', err);
            showMessage('Error voting.');
        }
    };

    // Helper: has this user already voted on this answer/type?
    const hasVoted = (answerId, type) => {
        return (votes[answerId]?.[type] || []).includes(userId);
    };

    // Helper: has this user finished voting on all answers (except their own)?
    const allVotesCast = () => {
        return Object.entries(submittedAnswers)
            .filter(([id]) => id !== userId)
            .every(([id]) =>
                (votes[id]?.hearts || []).includes(userId) || (votes[id]?.redFlags || []).includes(userId)
            );
    };

    // Voting phase: all submitted, but not all votes cast
    if (allSubmitted && !allVotesCast()) {
        // Show all submitted answers anonymously, except own
        const submissions = Object.entries(submittedAnswers).filter(([id]) => id !== userId);
        return (
            <div>
                <h2 className="text-2xl font-bold mb-2">{currentPrompt.text}</h2>
                <p className="mb-4">Vote on each answer (heart or red flag):</p>
                {submissions.map(([id, sub], idx) => (
                    <div key={id} className="mb-4 p-4 bg-white bg-opacity-20 rounded-lg">
                        <p className="text-lg text-white font-semibold">Answer {idx + 1}:</p>
                        <p className="text-xl text-white italic mb-2">"{currentPrompt.choices[sub.choiceKey]}"</p>
                        <div className="flex gap-4">
                            <button
                                disabled={hasVoted(id, 'hearts')}
                                onClick={() => handleVote(id, 'hearts')}
                                className={`px-4 py-2 rounded-full font-bold text-white ${hasVoted(id, 'hearts') ? 'bg-pink-400 opacity-50' : 'bg-pink-500 hover:bg-pink-600'}`}
                            >
                                ❤️ Heart
                            </button>
                            <button
                                disabled={hasVoted(id, 'redFlags')}
                                onClick={() => handleVote(id, 'redFlags')}
                                className={`px-4 py-2 rounded-full font-bold text-white ${hasVoted(id, 'redFlags') ? 'bg-red-400 opacity-50' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                🚩 Red Flag
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Waiting for others to finish voting
    if (allSubmitted && !allVotesCast()) {
        return <p className="text-center text-xl text-gray-200">Waiting for you to finish voting on all answers...</p>;
    }

    // Results phase: all votes cast
    if (allSubmitted && allVotesCast()) {
        // Tally hearts and red flags for each player
        const submissions = Object.entries(submittedAnswers);
        const playerTotals = {};
        submissions.forEach(([id, sub]) => {
            const hearts = (votes[id]?.hearts || []).length;
            const redFlags = (votes[id]?.redFlags || []).length;
            playerTotals[id] = {
                totalHearts: (gameData.players[id]?.totalHearts || 0) + hearts,
                totalRedFlags: (gameData.players[id]?.totalRedFlags || 0) + redFlags,
                choiceKey: sub.choiceKey
            };
        });
        // Only the host should update the database and advance the round
        if (gameData.hostId === userId) {
            const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
            const updatedPlayers = { ...gameData.players };
            Object.keys(playerTotals).forEach(pid => {
                updatedPlayers[pid] = {
                    ...updatedPlayers[pid],
                    totalHearts: playerTotals[pid].totalHearts,
                    totalRedFlags: playerTotals[pid].totalRedFlags
                };
            });
            // If last round, go to winner, else leaderboard
            const isLastRound = gameData.currentRound >= gameData.maxRounds;
            updateDoc(gameRef, {
                players: updatedPlayers,
                status: isLastRound ? 'winner' : 'round_end',
                roundResults: playerTotals,
                currentWinningSubmission: [],
                votes: {},
                submittedAnswers: {},
                // prompts and currentRound are updated in handleNextRound
            });
        }
        // Show a waiting message while host updates
        return <p className="text-center text-xl text-gray-200">Calculating results and updating leaderboard...</p>;
    }

    // Submission phase
    if (!hasSubmitted) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-2">{currentPrompt.text}</h2>
                <p className="mb-4">Pick your favorite answer:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(currentPrompt.choices).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => handleSubmitChoice(key)}
                            className="p-4 bg-white text-black rounded-lg shadow"
                        >
                            {key.toUpperCase()}: {value}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Waiting for others
    return <p className="text-center text-xl text-gray-200">Waiting for other players to submit...</p>;
};

// LeaderboardPage Component
const LeaderboardPage = ({ gameData, userId, gameId, showMessage, handleNextRound }) => {
    const isHost = gameData.hostId === userId;
    const players = Object.values(gameData.players).sort((a, b) => b.score - a.score);
    const currentPrompt = getCurrentPrompt(gameData);

    return (
        <div className="text-center p-4">
            <h2 className="text-4xl font-bold text-white mb-6 animate-fade-in-down">Round {gameData.currentRound} Results</h2>
            {/* Show the current question/prompt at the top */}
            {currentPrompt && (
                <div className="mb-8 bg-white bg-opacity-20 rounded-xl p-4 max-w-2xl mx-auto">
                    <p className="text-lg md:text-2xl font-bold text-yellow-200 mb-2">Question:</p>
                    <p className="text-xl md:text-2xl text-white">{currentPrompt.text}</p>
                </div>
            )}

            <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl shadow-lg p-6 w-full max-w-2xl mx-auto">
                <h3 className="text-3xl font-bold text-white mb-4">Leaderboard</h3>
                {gameData.category === "Red Flag or Relationship Goals?" && gameData.roundResults && (
                    <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl shadow-lg p-6 mb-8 w-full max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-cyan-300 mb-4">How did everyone do?</h3>
                        <div className="space-y-4">
                            {players.map(player => {
                                const result = gameData.roundResults[player.id];
                                if (!result) return null;
                                // Use the player's answer for this round from roundResults, fallback to submittedAnswers if needed
                                let choiceKey = result.choiceKey;
                                if (!choiceKey && gameData.submittedAnswers && gameData.submittedAnswers[player.id]) {
                                    choiceKey = gameData.submittedAnswers[player.id].choiceKey;
                                }
                                const answerText = choiceKey && currentPrompt.choices ? currentPrompt.choices[choiceKey] : '(No answer)';
                                const hearts = result.hearts || 0;
                                const redFlags = result.redFlags || 0;
                                return (
                                    <div key={player.id} className="text-left p-4 bg-gray-900 bg-opacity-50 rounded-lg">
                                        <p className="font-bold text-white text-xl">{player.name}'s take:</p>
                                        <p className="text-gray-300 italic my-2">"{answerText}"</p>
                                        <div className="flex justify-end items-center space-x-4 text-xl">
                                            {hearts > 0 && <span className="text-pink-400 font-bold">❤️ {hearts}</span>}
                                            {redFlags > 0 && <span className="text-red-500 font-bold">🚩 {redFlags}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {gameData.category === "Red Flag or Relationship Goals?" ? (
                    <ul className="space-y-3 mb-8">
                        {players.map((player, index) => (
                            <li key={player.id} className={`flex items-center justify-between p-4 rounded-xl shadow-md text-white ${
                                index === 0 ? 'bg-yellow-400 bg-opacity-50' : 'bg-white bg-opacity-30'
                            }`}>
                                <span className="text-lg font-semibold">{player.name}</span>
                                <div className="flex items-center space-x-4 text-lg">
                                    <span className="text-pink-400 font-bold">❤️ {player.totalHearts || 0}</span>
                                    <span className="text-red-500 font-bold">🚩 {player.totalRedFlags || 0}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="space-y-3 mb-8">
                        {players.map((player, index) => (
                            <li key={player.id} className={`flex items-center justify-between p-4 rounded-xl shadow-md ${
                                index === 0 ? 'bg-yellow-300 text-gray-900 font-bold text-xl' : 'bg-white bg-opacity-30 text-white'
                            }`}>
                                <div className="flex items-center space-x-4">
                                    <span className="text-lg font-bold">{index + 1}.</span>
                                    <span className="text-lg">{player.name}</span>
                                </div>
                                <span className="text-lg font-bold">{player.score} pts</span>
                            </li>
                        ))}
                    </ul>
                )}
                {isHost && (
                    <button
                        onClick={handleNextRound}
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                    >
                        {gameData.currentRound < gameData.maxRounds ? 'Next Round' : 'Show Final Results'}
                    </button>
                )}
                {!isHost && (
                    <p className="text-xl text-gray-300 italic">Waiting for host to continue...</p>
                )}
            </div>
        </div>
    );
};

// WinnerPage Component
const WinnerPage = ({ gameData, userId, onPlayAgain, showMessage }) => {
    // Add ad logic here
    const [showAd, setShowAd] = useState(true);
    const adIndex = 0; // Always show the first ad, or randomize if you want
    const [analyticsUpdated, setAnalyticsUpdated] = useState(false);

    const handleCloseAd = async () => {
        setShowAd(false);
        // Analytics: Only the host should update analytics
        if (gameData.hostId === userId && !analyticsUpdated) {
            try {
                // Increment global games played
                const statsRef = doc(db, `artifacts/${appId}/public/data/analytics`, 'globalStats');
                await updateDoc(statsRef, { gamesPlayed: increment(1) }).catch(async (err) => {
                    if (err.code === 'not-found') {
                        await setDoc(statsRef, { gamesPlayed: 1 });
                    }
                });
                // Increment gamesPlayed and set lastPlayed for all players
                for (const player of Object.values(gameData.players)) {
                    const playerStatsRef = doc(db, `artifacts/${appId}/public/data/playerStats`, player.id);
                    await updateDoc(playerStatsRef, { gamesPlayed: increment(1), lastPlayed: serverTimestamp() }).catch(async (err) => {
                        if (err.code === 'not-found') {
                            await setDoc(playerStatsRef, { gamesPlayed: 1, lastPlayed: serverTimestamp(), name: player.name });
                        }
                    });
                }
                // Increment wins for the winner(s)
                let winners = [];
                if (gameData.category === "Red Flag or Relationship Goals") {
                    const players = Object.values(gameData.players);
                    let minRatio = Math.min(...players.map(p => ((p.totalRedFlags || 0) / (((p.totalHearts || 0) + (p.totalRedFlags || 0)) || 1))));
                    winners = players.filter(p => ((p.totalRedFlags || 0) / (((p.totalHearts || 0) + (p.totalRedFlags || 0)) || 1)) === minRatio);
                } else {
                    const players = Object.values(gameData.players);
                    let maxScore = Math.max(...players.map(p => p.score || 0));
                    winners = players.filter(p => (p.score || 0) === maxScore);
                }
                for (const winner of winners) {
                    const playerStatsRef = doc(db, `artifacts/${appId}/public/data/playerStats`, winner.id);
                    await updateDoc(playerStatsRef, { wins: increment(1) }).catch(async (err) => {
                        if (err.code === 'not-found') {
                            await setDoc(playerStatsRef, { wins: 1, name: winner.name });
                        }
                    });
                }
                setAnalyticsUpdated(true);
            } catch (err) {
                console.error('Error updating analytics:', err);
            }
        }
    };

    // Add a guard clause for gameData
    if (!gameData || !gameData.players) {
        return <div className="text-center p-4 text-white">Loading final results...</div>;
    }

    const players = Object.values(gameData.players).sort((a, b) => {
        if (gameData.category === "Red Flag or Relationship Goals") {
             const aRatio = ((a.totalRedFlags || 0) / (((a.totalHearts || 0) + (a.totalRedFlags || 0)) || 1));
             const bRatio = ((b.totalRedFlags || 0) / (((b.totalHearts || 0) + (b.totalRedFlags || 0)) || 1));
             return aRatio - bRatio; // Sort by lowest red flag ratio
        }
        return (b.score || 0) - (a.score || 0); // Default score sort
    });
    
    const isHost = gameData.hostId === userId;

    const handleDeleteGame = async () => {
        showMessage("Are you sure you want to delete this game? This action cannot be undone.", async () => {
            try {
                if (gameData.id) {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/games`, gameData.id));
                    onPlayAgain(); // Go back to home page after deletion
                } else {
                    console.error("Game ID is undefined, cannot delete.");
                    showMessage("Failed to delete game: Game ID missing.");
                }
            } catch (error) {
                console.error("Error deleting game:", error);
                showMessage("Failed to delete game. Please try again.");
            }
        });
    };

    const getPlayerTitleAndDescription = (player) => {
        if(gameData.category !== "Red Flag or Relationship Goals") {
            return { title: `Score: ${player.score}`, description: "Played a different game mode." };
        }

        const { totalHearts, totalRedFlags } = player;
        const totalVotes = (totalHearts || 0) + (totalRedFlags || 0);

        if (totalVotes === 0) {
            return { title: "Mystery Card", description: "Not enough votes to get a read. Are you an enigma or just quiet?" };
        }

        const redFlagPercentage = (totalRedFlags / totalVotes) * 100;
        const rating = Math.round(redFlagPercentage / 10) * 10;

        return RED_FLAG_TITLES[rating] || { title: "Calculation Error", description: "Something went wrong here."};
    };

    return (
        <div className="text-center p-4">
            {/* Full-page ad overlay at end of game */}
            {showAd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center relative">
                        <img src={POPUP_ADS[adIndex].image} alt="Kriya Botanicals" className="w-48 h-48 object-cover rounded-xl mb-4 shadow-lg" />
                        <h2 className="text-3xl font-extrabold text-green-700 mb-2">{POPUP_ADS[adIndex].title}</h2>
                        <p className="text-lg text-gray-800 mb-6">{POPUP_ADS[adIndex].description}</p>
                        <button
                            onClick={handleCloseAd}
                            className="bg-gradient-to-r from-green-500 to-lime-400 hover:from-green-600 hover:to-lime-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                        >
                            Continue
                        </button>
                        <span className="absolute top-2 right-4 text-xs text-gray-400">Sponsored</span>
                    </div>
                </div>
            )}
            {!showAd && (
            <>
            <h2 className="text-5xl font-bold text-yellow-300 mb-4 animate-bounce">Game Over!</h2>
            {players.length > 0 ? <h3 className="text-3xl text-white mb-8">And the winner is... <span className="font-bold text-cyan-400">{players[0].name}!</span></h3> : null}

            <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl shadow-lg p-6 w-full max-w-2xl mx-auto">
                <h4 className="text-2xl font-bold text-white mb-4">Final Standings</h4>
                 <ul className="space-y-4">
                    {players.map((player, index) => {
                        const { title, description } = getPlayerTitleAndDescription(player);
                        return (
                            <li key={player.id} className="text-left p-4 bg-gray-900 bg-opacity-50 rounded-lg text-white">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-xl font-bold ${index === 0 ? 'text-yellow-400' : ''}`}>{index + 1}. {player.name}</span>
                                    <span className="text-lg font-semibold text-cyan-300 text-right">{title}</span>
                                </div>
                                <p className="text-sm text-gray-300 italic">"{description}"</p>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {isHost && (
                <>
                    <button
                        onClick={onPlayAgain}
                        className="w-full bg-gradient-to-r from-green-500 to-lime-400 hover:from-green-600 hover:to-lime-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 mb-4"
                    >
                        Play Again!
                    </button>
                    <button
                        onClick={handleDeleteGame}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
                    >
                        Delete This Game
                    </button>
                </>
            )}
            {!isHost && (
                <p className="text-xl text-gray-300 italic">Ask the host to start a new game!</p>
            )}
            </>) }
        </div>
    );
};

// Utility function to shuffle an array (Fisher-Yates)
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

// Utility function to get a random prompt that hasn't been played yet
const getRandomPrompt = (promptList, history) => {
    // History should contain the 'text' of previously played prompts
    const availablePrompts = promptList.filter(p => !history.includes(p.text));
    if (availablePrompts.length === 0) {
        console.warn("All prompts for this category have been used. Reshuffling prompts for this round.");
        return promptList[Math.floor(Math.random() * promptList.length)]; // If all used, pick randomly from full list
    }
    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    return availablePrompts[randomIndex];
};

// Utility function to safely get the current prompt for the round
function getCurrentPrompt(gameData) {
    const prompts = Array.isArray(gameData.prompts) ? gameData.prompts : [];
    const roundIndex = (typeof gameData.currentRound === 'number' && Number.isInteger(gameData.currentRound) && gameData.currentRound > 0) ? gameData.currentRound - 1 : -1;
    if (roundIndex >= 0 && roundIndex < prompts.length) {
        return prompts[roundIndex];
    }
    return null;
}

export default App;
