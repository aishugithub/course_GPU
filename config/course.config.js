// ============================================================
//  COURSE CONFIG — the ONLY file you edit per course
//
//  How it wires up (unchanged from the Foothold engine):
//    - Each `unitId` must EXACTLY match a file in src/lessons/
//      without the .jsx extension  (e.g. "Unit1_1" ↔ Unit1_1.jsx).
//    - Adding a lesson = drop the file in src/lessons/ + add one
//      line here. App.jsx auto-discovers lesson files via glob;
//      Dashboard.jsx renders module/unit cards straight from this list.
//    - `icon` is an optional emoji shown on the module card.
//    - Units ending in "_C" are the module capstones.
//    - `hook`  — the two attention lines at the top of the Dashboard.
//    - `blurb` — one catchy line per module and, optionally, per unit.
//
//  Practicals live in /notebooks as Google Colab notebooks (one per
//  module, split into Parts). Lessons link to them with an
//  "Open in Colab" button — Colab opens them straight from GitHub.
// ============================================================

const COURSE_CONFIG = {

  courseId:    "course_GPU",
  courseTitle: "GPU Computing for AI",
  subtitle:    "Why AI runs on GPUs — from a single neuron to thousands of cores",
  batch:       "2026",

  hook: {
    line1: "Face unlock, ChatGPT, self-driving cars — all of it runs on one kind of chip. Time to find out why.",
    line2: "Train a neuron, race a CPU against a GPU, and run real code on a real GPU in Colab — free.",
  },

  modules: [
    {
      moduleId:    "M0",
      moduleTitle: "What Is AI, Really?",
      icon:        "🧠",
      blurb:       "No magic, no robots — just numbers, multiplication and a lot of practice. Build the idea of AI from scratch.",
      units: [
        { unitId: "Unit0_1", title: "Rules vs Learning",
          blurb: "Some problems you can't write rules for. So you let the computer find the rules itself." },
        { unitId: "Unit0_2", title: "Everything Is Numbers",
          blurb: "A cat photo, a WhatsApp message, a song: to a computer, all of them are just long lists of numbers." },
        { unitId: "Unit0_3", title: "The Neuron",
          blurb: "Multiply, add, decide. The tiny calculator that all of AI is built from." },
        { unitId: "Unit0_4", title: "Learning = Reducing Error",
          blurb: "Measure how wrong you are, feel which way is downhill, take a step. Repeat a million times." },
        { unitId: "Unit0_5", title: "Layers = Matrix Multiplication",
          blurb: "Stack neurons into layers and something surprising happens: all of AI turns into one giant multiplication table." },
        { unitId: "Unit0_C", title: "Capstone: Train a Tiny Network",
          blurb: "Twenty students, one neuron, zero rules given. Watch it learn to predict who passes." },
      ],
    },
    {
      moduleId:    "M1",
      moduleTitle: "Why Is AI So Hungry?",
      icon:        "🍔",
      blurb:       "One chatbot answer: a quadrillion multiply-adds. Count AI's appetite and watch an ordinary CPU start to choke.",
      units: [
        { unitId: "Unit1_1", title: "Counting the Multiply-Adds",
          blurb: "Work ÷ speed = time. The one division that explains why AI needs special chips." },
        { unitId: "Unit1_2", title: "Training vs Inference, Epochs & Batches",
          blurb: "Using a model is like writing an exam; training it is the months of preparation. Guess which one is hungrier." },
        { unitId: "Unit1_3", title: "Every Output Is Independent",
          blurb: "AI's huge appetite comes with a hidden gift: almost none of the work has to wait in a queue." },
        { unitId: "Unit1_C", title: "Capstone: The Compute Bill",
          blurb: "Your principal wants an AI helpdesk. Work out the computing it needs, the machine and the bill, before anyone spends a rupee." },
      ],
    },
    {
      moduleId:    "M2",
      moduleTitle: "CPU vs GPU",
      icon:        "⚔️",
      blurb:       "One brilliant professor or a thousand ordinary students? Race them, and see why physics forced chips to go wide.",
      units: [
        { unitId: "Unit2_1", title: "Latency vs Throughput",
          blurb: "A car is faster for one person; a bus is faster for fifty. CPUs and GPUs are the car and the bus." },
        { unitId: "Unit2_2", title: "Why Clocks Stopped Getting Faster",
          blurb: "Around 2005 physics hit the brakes on CPU speed. Chips had to go wide instead, and that's where GPUs come in." },
        { unitId: "Unit2_3", title: "SIMD → SIMT",
          blurb: "One instruction, many data. Then the GPU's trick: write code for one thread and run ten thousand copies." },
        { unitId: "Unit2_4", title: "Amdahl's Law",
          blurb: "The GPU made the maths 100× faster, so why is your program only 3× faster? Meet the law that keeps everyone honest." },
        { unitId: "Unit2_C", title: "Capstone: CPU or GPU?",
          blurb: "Six jobs, one GPU server, and you decide where each one runs. Watch out for the traps." },
      ],
    },
    {
      moduleId:    "M3",
      moduleTitle: "Inside a GPU",
      icon:        "🔬",
      blurb:       "Open the chip: forty mini-processors, warps of 32 threads marching in step, and a clever trick for never waiting on memory.",
      units: [
        { unitId: "Unit3_1", title: "SMs, Cores & Tensor Cores",
          blurb: "2,560 cores organised like a university, plus special units that do a whole matrix multiply in one tick." },
        { unitId: "Unit3_2", title: "Warps & Branch Divergence",
          blurb: "32 threads march in lock-step, so one if-statement can make half of them stand still. Learn to keep the band together." },
        { unitId: "Unit3_3", title: "Hiding Latency",
          blurb: "Memory is slow, so the GPU never waits for it. Like a tea master with twelve cups on the go." },
        { unitId: "Unit3_4", title: "GPU Memory & Bandwidth",
          blurb: "65 TFLOPS is useless if the numbers can't arrive. Registers, shared memory, global memory: who feeds whom." },
        { unitId: "Unit3_C", title: "Capstone: Map a Job onto a GPU",
          blurb: "Threads, warps, waves, bytes and FLOPs: plan a real AI layer on the T4 before writing a line of code." },
      ],
    },
    {
      moduleId:    "M4",
      moduleTitle: "CPU–GPU Teamwork",
      icon:        "🤝",
      blurb:       "The CPU is the manager, the GPU the workforce. Learn exactly how work and data cross the bridge between them.",
      units: [
        { unitId: "Unit4_1", title: "Host & Device on PCIe",
          blurb: "Your GPU lives in a different building with its own memory. Everything it touches has to be carried over first." },
        { unitId: "Unit4_2", title: "The Five Steps of Offloading",
          blurb: "Allocate, copy in, launch, copy out, free: the routine hiding behind every .to(\"cuda\") you'll ever write." },
        { unitId: "Unit4_3", title: "Kernels, Grids, Blocks, Threads",
          blurb: "A million threads need roll numbers. Exam halls, seat numbers, and the one-line formula every GPU program uses." },
        { unitId: "Unit4_4", title: "Async Launch & Synchronization",
          blurb: "The CPU drops an order slip and walks away. Learn when it must come back and wait, and why that matters." },
        { unitId: "Unit4_C", title: "Capstone: Where Did the Time Go?",
          blurb: "A team's GPU sits idle most of the time. Measure, find every culprit, and make their training fly." },
      ],
    },
    {
      moduleId:    "M5",
      moduleTitle: "Making AI Fast & Real Projects",
      icon:        "🚀",
      blurb:       "Tiling, Tensor Cores, fewer bits and the roofline, then real projects: memory maths, out-of-memory errors and many GPUs at once.",
      units: [
        { unitId: "Unit5_1", title: "Parallel Matrix Multiply & Tiling",
          blurb: "Stop walking to the library for every page: fetch a tile once and let the whole team reuse it." },
        { unitId: "Unit5_2", title: "Precision: FP32 → FP16/BF16 → INT8",
          blurb: "Fewer bits per number: half the memory, Tensor Cores switched on, and the AI barely notices." },
        { unitId: "Unit5_3", title: "Compute-bound vs Memory-bound",
          blurb: "One chart, the roofline, gives the speed limit of any operation. It also explains why chatbots type one word at a time." },
        { unitId: "Unit5_4", title: "Batch Size & Training on GPU",
          blurb: "Bigger batches, mixed precision and an eight-line recipe that makes training run well on the GPU, not just run." },
        { unitId: "Unit5_5", title: "Capstone: Speed Up a Training Run",
          blurb: "A demo tomorrow and training far too slow. Climb the speed-up ladder one measured rung at a time." },
        { unitId: "Unit5_6", title: "The Software Stack",
          blurb: "One line of Python passes through six layers of software before a transistor switches. Meet each one." },
        { unitId: "Unit5_7", title: "Will It Fit? Sizing GPU Memory",
          blurb: "2 bytes per parameter to run a model, about 16 to train it. Do the maths before the GPU does it for you." },
        { unitId: "Unit5_8", title: "nvidia-smi & Out-of-Memory",
          blurb: "Read the GPU's dashboard, decode the dreaded OOM message, and catch memory leaks red-handed." },
        { unitId: "Unit5_9", title: "Many GPUs & Other Accelerators",
          blurb: "Thousands of GPUs training one model, plus the TPUs and NPUs in the cloud and in your pocket." },
        { unitId: "Unit5_C", title: "Grand Capstone: Plan an AI Project",
          blurb: "Three college AI projects, one budget. Plan memory, time and cost, then run a real language model on the GPU." },
      ],
    },
  ],
};

export default COURSE_CONFIG;
