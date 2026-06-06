import bcrypt from "bcrypt";

async function test() {
  console.log(await bcrypt.hash("123", 10));
}

test();