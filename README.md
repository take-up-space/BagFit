# BagFit
<img alignb=top width="10%" alt="AirplaneChair_Icon" src="https://github.com/user-attachments/assets/5c95664d-4586-4232-ae52-9aebbe9fe5bf" />


## About The Project

This project, named BagFit, is a full-stack application created as an experiment in vibe coding. It consists of a frontend and a backend that work together to provide a web tool designed to help travelers determine if their personal item carry-on bag will fit under the airplane seat in front of them.


## Built With

  •	**Gemini** (for project planning)  
	•	**Replit** (for development)  
	•	**React** (for the user interface)  
	•	**Express.js** (for the backend server)  
	•	**TypeScript** (for the programming language)  
	•	**Tailwind CSS** (for styling)  
	•	**Radix UI** (for accessible UI components)  
	•	**Drizzle ORM** (for database interactions)  
	•	**Vite** (as the build tool)


## Getting Started

To get a local copy of the project running, follow these steps.

### Prerequisites

•	**Node.js**: Ensure you have Node.js and npm installed.  
•	**Database**: This project uses a Neon serverless database. You will need to create an account and obtain a connection string from your Neon dashboard.

### Installation

1.	Clone the repository:
   
      ```
    Bash  
    git clone https://github.com/take-up-space/BagFit.git
      ```

2.	Navigate to the project directory:  
   
      ```
    Bash
    cd BagFit  
      ```
      
3.	Install NPM packages:
   
      ```
    Bash  
    npm install  
      ```

4. Create a file named `.env` in the project's root folder and add your database connection string to it. Replace `[YOUR_NEON_DATABASE_URL]` with your actual URL:
   
      ```
    DATABASE_URL=[YOUR_NEON_DATABASE_URL]  
    ```  

### Running the Project

1.	Push the database schema to your database:  
  
      ```
    Bash  
    npm run db:push  
    ```  

2.	Start the development server:

      ```
    Bash  
    npm run dev  
    ```  

## Usage

<img align="top" width="100%" alt="Screenshot_LandingPage" src="https://github.com/user-attachments/assets/84377b8d-fcba-43c6-883b-dea4163e055f" />  

<br/>
<br/>

  <img align="top" width="100%" alt="Screenshot_AirlinesList" src="https://github.com/user-attachments/assets/71547da0-7055-405b-ab9c-9ed88ef3c748" />  

<br/>
<br/>

</p>
  <p float="left">
<img align="top" width="49%" alt="Screenshot _ToolPage" src="https://github.com/user-attachments/assets/9382cccf-f102-4514-80cf-9f16f43087d4" />  
<img align="top" width="49%" alt="Screenshot_BagsDropDownMenu" src="https://github.com/user-attachments/assets/9661f50d-0c21-4696-8f75-623388247f34" />  
</p>
<br/>
<br/>

  <p float="left">
<img align="top" width="49%" alt="Screenshot_MyBags" src="https://github.com/user-attachments/assets/16172855-b6f7-4aca-9971-ff1f4a9007bd" />  
<img align="top" width="49%" alt="Screenshot_MyBagsDropDown" src="https://github.com/user-attachments/assets/ba96bbf2-97b3-48f8-873a-0614a9a982f7" />  
</p>

## Roadmap

### Phase 1: What's Live Now (MVP Complete)  
🟢 Verified Data: Sourced from over 25 major airlines.  
🟢 Bag Compatibility Checking: Instant "Fits" or "Doesn't Fit" results against an airline's under-seat policies.  
🟢 Popular Pet Carrier Models Database: 10+ verified bags from major manufacturers.  
🟢 Pet Carrier Support: Dedicated checks for airline pet carrier size restrictions.  
🟢 My Bags Feature: Save personal bags to your profile for quick access.  
🟢 Unit Conversion: Easily switch between inches and centimeters.  
🟢 Robust Foundation: A modern stack designed for performance and security.  


If I were to continue working on this project...

### Phase 2: Enhanced UX & Community Data ("Soon")  
🟡 Generalize App to All Bags: Debug the backend to enable a dropdown menu of 90+ popular personal item bags.  
🟡 Community Data Platform: Allow users to submit bag dimensions for the dropdown menu.  
🟡 Multisource Data Verification: Automatically cross-reference user dimensions against manufacturer and retailer sites to ensure accuracy.  
🟡 Data Expansion: Expand to 100+ global carriers and account for regional and aircraft variations.  

### Phase 3: Advanced Photo & AI Features ("Later")  
🟠 AI/AR Measurement: Use a phone camera and a reference object for AI-based dimension estimation.  
🟠 Reverse Image Search: Identify bag models from photos to retrieve manufacturer specs.  
🟠 Dimension Verification: Compare AI estimates, manufacturer specs, and community data for the most accurate dimensions.  



## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.  
	1.	Fork the Project  
	2.	Create your Feature Branch (git checkout -b feature/AmazingFeature)  
	3.	Commit your Changes (git commit -m 'Add some AmazingFeature')  
	4.	Push to the Branch (git push origin feature/AmazingFeature)  
	5.	Open a Pull Request  


## Contact
[My LinkedIn page](https://www.linkedin.com/in/vivianlin-phd/)

## Acknowledgments
•	This README document was created with the help of Gemini, which assisted in structuring the content and identifying key project technologies.
