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

// helper function

async function chatBot(userPrompt) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.choices[0].message.content.trim();
}
// below are the 5 different stages in which the model processes the customer query and provide
//  and an unambiguous response to the user

// stage 1: the raw customer query is passed onto the model for intent analysis, to undertand
// and interprete the customer's request.

async function intent(customerQuery) {
  return await chatBot(
    `customer's query : ${customerQuery}
    you are a banking customer assistant support analyze the intent of this customer query in maximum 4 words`
  );
}

// stage 2: map the analyzed intent to 2-3 most relevant categories from the available categories

async function suggestedCategories(intentAnalyzer) {
  return await chatBot(
    `based on the analyzed intent: ${intentAnalyzer} you are an intelligent banking customer support, specialize in customers query classification
     suggest 2-3 categories that best match the customer's query from ${availableCategories.join(
       ","
     )} no explanation, just return strictly the categories that fit and seperate the suggested categories with comma`
  );
}

//  stage 3: select the best category

async function selectedCategory(customerQuery, mappedCategory) {
  return await chatBot(
    `
   customer's query: ${customerQuery}\n\n suggested categories: ${mappedCategory}
   you are an intelligent banking customer support, specialize in customer's query classification,
  select only single best that matches the customer's query. Respond with only the category name.
  `
  );
}
// stage 4:Extract and request for an additional important details to complete the query

async function extractDetails(customerQuery, selectedCategory) {
  return await chatBot(
    `
    customer's query: ${customerQuery}\n\n
    based on selected category ${selectedCategory}
    you are a banking customer support assitant, request for only specific details needed to resolve the 
    customer's issue or complaint, in just one sentence
     `
  );
}
// stage 5: Generate a suitable response to the user

async function shortResponse(customerQuery, extractDetails) {
  return await chatBot(
    `
    customer's query: ${customerQuery}\n\n
    requested details: ${extractDetails}
    
    you are a banking customer support assistant return a very short and closing sentence
     to the customer without repeating the requested details`
  );
}

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

// testing testing testing!
runPromptchain("i notice a deduction in my account last night").then(
  (aiResponse) => {
    console.log(aiResponse);
  }
);
