import { Button, Frog, TextInput } from 'frog'
import { deployANONToken, mintTokens, createAztecAccount, addMinter, getBalance, sendDonation, getDonationBalance } from './utils';
import { getWallet, storeWallet } from "./db/data";

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
          {'ANONYMOUS DONATIONS Powered by Aztec Protocol'}
        </div>
      </div>
    ),
    intents: [
      <Button action="/claim">Claim $ANON</Button>,
      <Button action="/donate">Donate</Button>,
      <Button action="/about">About</Button>,
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
          {'Claim $ANON tokens and donate anonymously to a cause you care about.'}
        </div>
      </div>
    ),
    intents: [
      <Button action="/claim">Claim $ANON</Button>,
      <Button action="/">Back</Button>,
    ],
  })
})


app.frame('/claim', async (c) => {
  const { frameData } = c
  const { fid } = frameData

  let wallet;

console.log("claim called");
try {
 wallet = await getWallet(Number(fid)); 
 console.log('Wallet found:', wallet);
} catch (error) {
 console.error('Error:', error);
 // Handle any errors here
 wallet = null; // or handle the error as needed
}

  console.log("Log of Wallet: ", wallet)
  if (!wallet) {
    const aztecAccount = await createAztecAccount()
    console.log("WALLLLLETTTTTTTTTTTTT: ", aztecAccount)
    if (!aztecAccount) {
      wallet = null
    } else {
      wallet = await storeWallet(Number(fid), aztecAccount)
    }
  }

  let balance;
  const minter = await addMinter(wallet)
  console.log("Minter Output: ", minter);  
  console.log("Parsed Wallet Object :", wallet);

  if (!minter) {
    balance = null
  } else {
    balance = await mintTokens(wallet)
  }

  console.log("$ANON Balance: ", balance);

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
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          { (wallet && balance) ? `You successfully claimed 10,000 $ANON tokens for donations to ${wallet.getAddress()}`: 'Could not claim $ANON tokens. Please try again later.'} 
        </div>
      </div>
    ),
    intents: [
      balance && <Button action="/donate">Donate</Button>,
      <Button action="/">Back</Button>,
    ],
  })
})

app.frame('/donate', (c) => {
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
          {'Donate $ANON tokens'}
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter $ANON Amount" />,
      <Button action="/donate-transaction">Donate</Button>,
      <Button action="/">Back</Button>,
    ],
  })
})

app.frame('/donate-transaction', async (c) => {
  const { frameData, inputText } = c
  let { fid } = frameData

  let address = await checkAztecAddress(Number(fid))
  let errorMessage;

  if (!address) {
    errorMessage = "Could not find your Aztec account. Go back and Claim $ANON tokens."
  }

  const balance = await getBalance(String(address))

  if (!balance) {
    errorMessage = "Could not get your $ANON balance. Go back and Claim $ANON tokens."
  }

  const amount = Number(inputText)

  if (Number(balance) < amount) {
    errorMessage = "You do not have enough $ANON tokens. Go back and Claim $ANON tokens."
  }

  let tx = null
  tx = await sendDonation(String(address), amount)

  const donationBalance = await getDonationBalance()

  console.log("Transaction: ", tx)

  // const tx_url = `https://etherscan.io/tx/${tx.hash}`

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
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          { tx ? `You donated ${amount} $ANON tokens successfully. Total Donations: ${donationBalance} $ANON`: `${errorMessage}`}
        </div>
      </div>
    ),
    intents: [
      // tx && <Button.Link href="/tx">View</Button.Link>,
      !tx && <Button action="/claim">Claim $ANON</Button>,
      <Button action="/">Back</Button>,
    ],
  })
})
