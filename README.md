## A Frame for Anonymous donations powered by Aztec Protocol

This was a submission for the bounty on bountcaster for a frame utilizing the Noir programming language - https://www.bountycaster.xyz/bounty/0xf19067379c5ed332da2d22c28f30ac38183befe3

The frame allows Farcaster users to donate anonymously to a cause. An Aztec address is automatically created for a user when they claim $ANON tokens, which is a private token used for donations.

After claiming $ANON tokens, users can specify the amount of tokens they want to donate and those tokens are transferred anonymously to the donation wallet.

The frame was built using the frog framework by Paradigm and Wevm - https://frog.fm

To run the code you must download aztec sandbox as it is a prerequiste for running the Private Execution Environment (PXE).
Here is the quickstart guide - https://docs.aztec.network/developers/getting_started/quickstart

You can then install frog and run the application via the commands below.

```
npm init frog
npm install
npm run dev
```

Head to http://localhost:5173
