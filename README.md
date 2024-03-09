## A Frame for Anonymous donations powered by Aztec Protocol

This was a submission for the bounty on bountycaster for a frame utilizing the Noir programming language - https://www.bountycaster.xyz/bounty/0xf19067379c5ed332da2d22c28f30ac38183befe3

The frame allows Farcaster users to donate anonymously to a cause. An Aztec address is first created for a user before they can claim $ANON tokens, which is a private token used for donations.

After claiming $ANON tokens, users can donate and those tokens are transferred anonymously to the donation wallet.

![aztec_anon_donations](https://github.com/ykxy940/aztec-anonymous-donations/assets/160770682/b0da4058-417d-4a15-9f7a-1a68faf1d2b0)

You can watch the video presentation on YouTube - https://youtu.be/hpbpXmHUNE4

The frame was built using the frog framework by Paradigm and Wevm - https://frog.fm

To run the code you must download aztec sandbox as it is a prerequiste for running the Private Execution Environment (PXE).
Here is the quickstart guide - https://docs.aztec.network/developers/getting_started/quickstart

You will also need to install Redis on your server.

Redis is used to store Farcaster IDs, so that individuals cannot create multiple wallets.

You can then install frog and run the application via the commands below.

```
npm init frog
npm install
npm run dev
```

Head to http://localhost:5173

You can optionally deploy the app on a server and use ngrok to create a tunnel. See Frog docs for details - https://frog.fm/commands/dev
