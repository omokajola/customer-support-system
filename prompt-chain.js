import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

//  These are the available categories for custonmer query classification

const availableCategories = [
  "account opening",
  "billing issue",
  "account access",
  "transaction inquiry",
  "card services",
  "account statement",
  "loan inquiry",
  "general information",
];

// below are the 5 different stages in which the model processes the customer query and provide
//  and an unambiguous response to the user

// stage 1: the raw customer query is passed onto the model for intent analysis, to undertand
// and interprete the customer's request.

async function intent(customerQuery) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an intelligent customer support, kindly understand the customer intent
           and output their intention in just two words that fit tthe customer intent, no explanation`,
      },

      {
        role: "user",
        content: customerQuery,
      },
    ],
  });

  return response.choices[0].message.content.trim();
}

// stage 2: map the analyzed intent to 2-3 most relevant categories from the available categories

async function suggestedCategories(intentAnalyzer) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",

    messages: [
      {
        role: "system",
        content: `You are an intelligent banking customer support, you are to help
         customers get through to their complaints, take thier intent, suggest two or more categories 
         that might apply from ${availableCategories.join(
           ","
         )}  in just one line and no explanation 
         just from the list and output the best two or more that fit and seperated with comma`,
      },
      {
        role: "user",
        content: `customer intent: ${intentAnalyzer}`,
      },
    ],
  });
  return response.choices[0].message.content.trim();
}

// stage 3 : the prompt is designed to select the best fit from the mapped categories

async function selectedCategory(customerQuery, mappedCategory) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `you are an assistant bank customer support, select the single best, that fit the user's query
         from the provided category list and just retrun only the category name, no extra information.
       
        kindly choose from below
        available categories : ${availableCategories.join(",")}`,
      },

      {
        role: "user",
        content: mappedCategory,
      },
    ],
  });
  return response.choices[0].message.content.trim();
}

async function extractDetails(customerQuery, selectedCategory) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `you are an assistant bank customer support, kindly ask the user for the necessary details
         example transaction date, amount, card type, etc that requires to complete their request `,
      },

      {
        role: "user",
        content: `${customerQuery}
        selected category : ${selectedCategory}`,
      },
    ],
  });
  return response.choices[0].message.content.trim();
}
// stage 4:Extract and request for an additional important details to complete the query

async function shortResponse(customerQuery, extractDetails) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `you are a customer support assitant for a bank, generate a suitable short response  to the user`,
      },

      {
        role: "user",
        content: `${customerQuery} 

       previous support response: ${extractDetails}`,
      },
    ],
  });
  return response.choices[0].message.content.trim();
}
 
// stage 5: Generate a suitable response to the user

async function runPromptchain(customerQuery) {
  const intentAnalyzer = await intent(customerQuery);
  const mappedCategory = await suggestedCategories(intentAnalyzer);
  const finalResponse = await selectedCategory(customerQuery, mappedCategory);
  const gettingDetails = await extractDetails(customerQuery, finalResponse);
  const feedback = await shortResponse(customerQuery, gettingDetails);
  return [
    intentAnalyzer,
    mappedCategory,
    finalResponse,
    gettingDetails,
    feedback,
  ];
}
runPromptchain("i want to open an account").then(
  (aiResponse) => {
    console.log(aiResponse);
  }
);
