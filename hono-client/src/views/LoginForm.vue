<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router"

const router = useRouter()
const email = ref("")
const password = ref("")
const error = ref("")

async function login() {

    const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email.value,
            password: password.value
        })
    })

    const data = await res.json()

    console.log(data)

    if (data.success) {
        router.push("/homepage")
    } else {
        error.value = data.message
    }
}
</script>

<template>

    <div class="relative h-screen w-screen">

        <!-- BACKGROUND -->
        <div class="h-screen w-screen bg-secondary flex flex-col items-center">
            <div class="h-[350px] bg-primary w-full flex items-center justify-center">
                <img src="./Images/logo.png" alt="Logo" class="h-[200px]" />
            </div>

            <div class="flex-1 flex items-center justify-center -mt-32">
            </div>
        </div>

        <!-- BLUR -->
        <div class="absolute inset-0 backdrop-blur-lg bg-white/20 flex items-center justify-center"></div>

        <!-- LOGIN BOX -->
        <div class="absolute inset-0 flex items-center justify-center">

            <div class="bg-white w-[450px] rounded-3xl shadow-2xl p-10 text-center">

                <h1 class="text-4xl font-semibold mb-8">Login</h1>

                <input v-model="email" placeholder="Email"
                    class="w-full border rounded-full px-4 py-3 mb-4 outline-none" />

                <input v-model="password" placeholder="Password" type="password"
                    class="w-full border rounded-full px-4 py-3 mb-6 outline-none" />
                
                <p v-if="error" class="text-red-500 text-sm mb-4">
                    {{ error }}
                </p>

                <button @click="login" class="w-full bg-gray-300 hover:bg-gray-400 transition rounded-full py-3">
                    Login
                </button>

                <p class="mt-6 text-gray-600 hover:text-gray-800 cursor-pointer transition">
                    Forgotten password?
                </p>

            </div>

        </div>

    </div>

</template>