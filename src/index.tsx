import { Button, Frog } from 'frog'
import { deployANONToken, claimTokens, createAztecAccount, getUserBalance, sendDonation, getDonationBalance } from './utils';
import { getWalletDetails, storeWalletDetails } from "./db/data";

export const app = new Frog({
  // Supply a Hub API URL to enable frame verification.
  // hubApiUrl: 'https://api.hub.wevm.dev',
})

app.frame('/', async (c) => {
 
  return c.res({
    title: 'Anonymous Donations',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#7D4AE9',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {'ANONYMOUS DONATIONS Powered by Aztec Protocol        Create Wallet | Claim $ANON     Donate'}
        </div>
      </div>
    ),
    intents: [
      <Button action="/create">Create Wallet</Button>,
      <Button action="/claim">Claim $ANON</Button>,
      <Button action="/donate">Donate</Button>,
      <Button action="/about">About</Button>,
      // <Button action="/deploy">Deploy</Button>,
    ],
  })
})

app.frame('/about', (c) => {

  return c.res({
    title: 'About',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#7D4AE9',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {'First create an Aztec Wallet, then Claim $ANON tokens and Donate anonymously to a cause you care about.'}
        </div>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
    ],
  })
})

app.frame('/create', async (c) => {
  const { frameData, status } = c
  const { fid } = frameData  

  if (status === 'initial') {
    return;
  }
  
  if (status === 'redirect') {
    return;
  }
  
  let address;
  let signingKey;

try {
 let walletDetails = await getWalletDetails(String(fid));

 if (!walletDetails) {
  const aztecAccount = await createAztecAccount();
    if (!aztecAccount) {
      address = null
    } else {
      address = aztecAccount.address;
      signingKey = aztecAccount.signingKey;
      await storeWalletDetails(String(fid), String(address), String(signingKey))
    }
 } else {
   address = walletDetails.address;
 }
} catch (error) {
 console.error('Error:', error);
}

  return c.res({
    title: 'Create Wallet',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#7D4AE9',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 32,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          { (address) ? `Wallet: ${address}`: 'Could not create wallet. Please try again later.'} 
        </div>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
    ],
  })
})

app.frame('/claim', async (c) => {
  const { frameData, status } = c
  const { fid } = frameData

  let address;
  let txHash;

  try {
  let walletDetails = await getWalletDetails(String(fid));
  if (!walletDetails) {
    address = null;
  } else {
    address = walletDetails.address;
  }

} catch (error) {
 console.error('Error:', error);
}

  if (!address) {
    txHash = null;
  } else {
    txHash = await claimTokens(String(address));
  }
  
  console.log("txHash: ", txHash);

  return c.res({
    title: 'Claim $ANON',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#7D4AE9',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 32,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          { (address && txHash) ? `You successfully claimed 10,000 $ANON tokens for donations. Transaction Hash: ${txHash}`: 'Could not claim $ANON tokens. Have you created a wallet. Please try again later.'} 
        </div>
      </div>
    ),
    intents: [
      txHash && <Button action="/donate">Donate</Button>,
      !address && <Button action="/create">Create Wallet</Button>,
      <Button action="/">Back</Button>,
    ],
  })
})

app.frame('/donate', async (c) => {
  const { frameData, status } = c
  const { fid } = frameData

  let address;

  try {
  let walletDetails = await getWalletDetails(String(fid)); 
  if (!walletDetails) {
    address = null
  } else {
    address = walletDetails.address;
  }

  } catch (error) {
  console.error('Error:', error);
}

  return c.res({
    title: 'Donate $ANON',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#7D4AE9',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {(address) ? 'Donate 1,000 $ANON tokens': 'Create a wallet and claim tokens before trying to donate'}
        </div>
      </div>
    ),
    intents: [
      !address && <Button action="/create">Create Wallet</Button>,
      address && <Button action="/donate-transaction">Confirm</Button>,
      <Button action="/">Back</Button>,
    ],
  })
})

app.frame('/donate-transaction', async (c) => {
  const { frameData, status } = c
  let { fid } = frameData
  
  if (status === 'initial') {
    return;
  }

  if (status === 'redirect') {
    return;
  }

  let address;
  let signingKey;
  let txHash;
  let donationBalance;
  let errorMessage;

  try {
  let walletDetails = await getWalletDetails(String(fid)); 
  if (!walletDetails) {
    address = null
  } else {
    address = walletDetails.address;
    signingKey = walletDetails.signingKey;
  }

} catch (error) {
 console.error('Error:', error);
}
  
  if (!address) {
    errorMessage = "Could not find your Aztec account. Create a wallet and Claim $ANON tokens."
  }

  const balance = await getUserBalance(String(address), String(signingKey))

  if (!balance) {
    errorMessage = "Could not get your $ANON balance. Go back and Claim $ANON tokens."
  }

  if (Number(balance) < Number(1000)) {
    errorMessage = "You do not have enough $ANON tokens. Go back and Claim $ANON tokens."
  } else {
    txHash = await sendDonation(String(address), String(signingKey));

    if (!txHash) {
      errorMessage = "Could not donate $ANON tokens. Try again later."
    }

    donationBalance = await getDonationBalance();

    if (!donationBalance) {
      errorMessage = "Could not get Total Donations. Try again later."
    }
  }

  return c.res({
    title: '$ANON Donation Transaction',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#7D4AE9',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 33,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          { (txHash && donationBalance) ? `You donated 1,000 $ANON tokens successfully. Transaction Hash: ${txHash} Total Donations: ${donationBalance} $ANON`: `${errorMessage}`}
        </div>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
    ],
  })
})

app.frame('/deploy', async (c) => {
  const { status } = c

  if (status === 'initial') {
    return;
  }

  if (status === 'redirect') {
    return;
  }

  const deployedContractAddress = await deployANONToken();
  
  return c.res({
    title: 'Deploy',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: '#7D4AE9',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          { (deployedContractAddress) ? `Successfully deployed ANONToken contract : ${deployedContractAddress}` : 'Could not deploy token'}
        </div>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
    ],
  })
})
