import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  withCredentials: false,
});

export default client;

