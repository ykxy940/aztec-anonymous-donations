import Redis from "ioredis";

// Create a new Redis client
const redis = new Redis({
 host: 'localhost', // or the specific host if different
 port: 6379, // or the specific port if different
});

export async function getWalletDetails(fid: string) {
  try {
    const values = await redis.hgetall(fid);
    console.log("Retrieved values:", values);
    return values;
  } catch (error) {
    console.error(`Failed to retrieve wallet: ${error}`);
  }
}

export async function storeWalletDetails(fid: string, address: string, signingKey: string) {
  try {
    await redis.hset(
      fid,
      "address",
      address,
      "signingKey",
      signingKey
    );
    console.log("Values stored successfully");
  } catch (error) {
    console.error("Failed to store values:", error);
  }
}

redis.on("error", (error) => {
  console.error(`Redis error: ${error}`);
});

// Close the Redis connection
// redis.disconnect();


