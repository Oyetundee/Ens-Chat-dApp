# ENS Chat Dapp

A real-time decentralized chat application that combines ENS domain registration on the blockchain with instant WebSocket messaging.
Features
🔗 Blockchain Identity

ENS Domain Registration: Register your unique .ens name on-chain
Wallet Authentication: Connect with MetaMask or other Web3 wallets
Decentralized Identity: Your identity is stored on the blockchain

💬 Real-time Messaging

Instant Messages: No gas fees for individual messages
WebSocket Connection: Real-time message delivery
Group Chat: Public chat room for all users
Direct Messages: Private conversations between users

✨ User Experience

No MetaMask Popups: Messages send instantly without transaction confirmations
Contact Management: Add users by wallet address
Online Status: See who's currently active
Message Status: Delivery confirmations and timestamps
Responsive Design: Works on desktop and mobile

Tech Stack
Frontend

React - UI framework
Vite - Build tool and dev server
Wagmi - Ethereum React hooks
RainbowKit - Wallet connection UI
Framer Motion - Animations
Tailwind CSS - Styling
Zustand - State management

Backend

Node.js - WebSocket server
WebSocket (ws) - Real-time communication
Ethereum - Blockchain for identity

Smart Contract

Solidity - ENS registration contract
Custom ENS - Domain registration system

Installation
Prerequisites

Node.js (v16 or higher)
npm or yarn
MetaMask or compatible Web3 wallet
