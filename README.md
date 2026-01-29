Hoichoi Chrome Decrypter
I’ve noticed that in the ripping community, many people are hesitant to share their tools or teach others the process. I personally don't agree with that "gatekeeping" mindset. I reached out to several people for help, but no one was willing to support me. After a lot of hard work and persistence, I developed this Hoichoi Decrypter Tool myself.

I believe these tools should be accessible to everyone. That is why I am making this project public. This is a Chrome Extension designed to extract DRM keys from Hoichoi content easily.

Features
Extract DRM keys from any Hoichoi content.

Simple integration with Chrome Developer Mode.

Powered by a local Python backend for seamless processing.

Prerequisites
Before you begin, ensure you have Python installed on your system. You will also need to install the required dependencies.

1. Clone or Download the Repository
If you haven't already, clone the repository or download the ZIP file and extract it into a dedicated folder.

2. Install Dependencies
Open your terminal or command prompt in the project folder and run:

Bash
pip install -r requirements.txt
(Note: If you don't have a requirements file yet, ensure you have the necessary libraries installed to run app.py.)

Installation & Setup
Follow these steps to get the extension running:

Step 1: Run the Backend
You must keep the Python script running in the background for the extension to work.

Open your terminal in the project folder.

Run the following command:

Bash
python app.py
Step 2: Load the Extension in Chrome
Open Google Chrome and navigate to chrome://extensions/.

In the top right corner, toggle Developer mode to ON.

Click the Load unpacked button in the top left.

Select the folder where you unzipped this project (the folder containing the extension files).

How to Use
Ensure app.py is currently running.

Open Hoichoi in your Chrome browser and play any content.

Refresh the page once after the extension is installed.

Open the extension from your Chrome toolbar to extract the keys.

Note: The extension will not function unless the app.py script is active.

Future Updates
This is just the beginning. I am planning to bring more tools and updates to the community soon. Stay tuned!

Disclaimer: This tool is for educational purposes only. Please respect the terms of service of the platforms you interact with.
