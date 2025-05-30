



//use of Redis Client to connect to redis server
const {createClient}=require("redis");
const redisClient=createClient({
    url:"redis://localhost:6379"// Localhost with default Redis Port 
})

redisClient.on('error', (err) => console.error(' Redis Client Error:', err));

(async () => {
  try {
    await redisClient.connect();
    console.log(' Connected to Redis (Locally)');
  } catch (err) {
    console.error('Error connecting to Redis:', err);
  }
})();

module.exports = redisClient;
