import Redis from "ioredis";

// Create a new Redis client
const redis = new Redis({
 host: 'localhost', // or the specific host if different
 port: 6379, // or the specific port if different
});

export async function getWallet(fid) {
  try {
    let wallet = await redis.get(fid);
    if (wallet) {
      wallet = JSON.parse(wallet);
    }
    console.log(`Wallet for key ${fid}: ${wallet}`);
    return wallet;
  } catch (error) {
    console.error(`Failed to retrieve wallet: ${error}`);
  }
}

export async function storeWallet(fid, wallet) {
  try {
    const wallet = JSON.parse(wallet)
    await redis.set(fid, wallet);
    return wallet;
    console.log(`Wallet stored with key: ${fid}`);
  } catch (error) {
    console.error(`Failed to store wallet: ${error}`);
  }
}

redis.on("error", (error) => {
  console.error(`Redis error: ${error}`);
});

// Close the Redis connection
// redis.disconnect();



