import { Button, Frog, TextInput } from 'frog'
import { mintTokens, createAztecAccount, getBalance, sendDonation, getDonationBalance } from './utils';
import { initializeDatabase, createTable, checkAztecAddress, storeAztecAddress } from './db/database';

await initializeDatabase()
await createTable()

export const app = new Frog({
  // Supply a Hub API URL to enable frame verification.
  // hubApiUrl: 'https://api.hub.wevm.dev',
})

app.frame('/', (c) => {
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

  let address = await checkAztecAddress(Number(fid))

  if (!address) {
    const aztecAaddress = createAztecAccount()
    if (!aztecAaddress) {
      address = null
    } else {
      address = await storeAztecAddress(Number(fid), String(aztecAaddress))
    }
  }

  console.log("Address: ", address)

  const balance = await mintTokens(String(address))

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
          { (address && balance) ? `You successfully claimed 10,000 $ANON tokens for donations to ${address}`: 'Could not claim $ANON tokens. Please try again later.'} 
        </div>
      </div>
    ),
    intents: [
      <Button action="/donate">Donate</Button>,
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