const OpenAI = require('openai');

// Chat_gpt 답변 생성
const chatGpt = async (prompt, model = "gpt-3.5-turbo") => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const chatCompletion = await openai.chat.completions.create({
        model: model,
        messages: [
            { "role": "system", "content": "You are expert in laundry. Please explain materials and washing method based on the data sent by the user in Korean." }, 
            { "role": "user", "content": prompt }
        ]
    });

    return chatCompletion.choices[0].message.content;
};

// GPT-3.5 Turbo를 사용하여 요약 정리
const summarizeWithGpt = async (organizedSearchResult) => {
    console.log('organizedSearchResult:', organizedSearchResult);

    if (!Object.keys(organizedSearchResult).length) {
        return "검색 결과가 없습니다.";
    }

    const prompt = `${organizedSearchResult.materials}: 소재에 대해 설명해줘. 그리고 각 소재별 세탁방법도 한국어로 친절하게 설명해줘. 총 500자 이내로 알려줘.`;
    const answer = await chatGpt(prompt);

    return answer.trim();
};

module.exports = { summarizeWithGpt };