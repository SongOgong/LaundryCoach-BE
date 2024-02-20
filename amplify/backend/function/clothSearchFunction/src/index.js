const awsServerlessExpress = require('aws-serverless-express');
const app = require('./app');

const { getSearchResult } = require('./es');
const { summarizeWithGpt } = require("./gpt_summary");
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb")

/**
 * @type {import('http').Server}
 */
const server = awsServerlessExpress.createServer(app);

// 세탁 방법 가져오기 (DynamoDB)
const getWashingMethods = async (howToLaundry) => {
  const client = new DynamoDBClient();
  
  const promises = howToLaundry.map(async (item) => {
    const key = item.key;

    // DynamoDB 쿼리 작성
    const input = {
        TableName: 'smwu-003-washing-method-list', // 테이블 이름 설정
        method_name: {
          S: key
        }
    };
    

    try {
        // DynamoDB에서 아이템 가져오기
        const command = new GetItemCommand(input);
        const response = await client.send(command);
        
        console.log(response);
        
        return { key, washingMethod: response.Item ? response.Item.desc : 'Description not found' };
    } catch (error) {
        console.error(`Error fetching washing method for key ${key}:`, error);
        return { key, washingMethod: 'Error fetching description' };
    }
  });

    // 모든 프로미스를 병렬로 실행하고 결과 반환
    return Promise.all(promises);
};

// 검색 결과 정리
const organizeSearchResult = async (searchResult) => {
    // 소재 저장
    const popularMaterials = searchResult.popularMaterials.map((item) => item.key);
    const materials = popularMaterials.join(', ');

    // 세탁 방법 저장
    const howToLaundry_desc = await getWashingMethods(searchResult.howToLaundry); // await 추가

    // 결과 반환
    return { materials, howToLaundry_desc };
};


// 최종 검색 결과 생성
const getFinalSearchResult = async (organizedSearchResult, summary) => {
    const materials = organizedSearchResult.materials;
    const methods = organizedSearchResult.methods;

    return {
        materials: materials,
        methods: methods,
        summary: summary
    };
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event, callback) => {

  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('Received event.queryStringParameters:', JSON.stringify(event.queryStringParameters, null, 2));

    // URL 파라미터로부터 쿼리 추출
    const query = event.queryStringParameters.filter;   // 쿼리 추출
    const searchResult = await getSearchResult(query);  // 검색 결과 가져오기
    const organizedSearchResult = organizeSearchResult(searchResult); // 검색 결과 정리
    const summary = await summarizeWithGpt(organizedSearchResult);  // GPT-3.5 Turbo를 사용하여 요약 정리
    const finalSearchResult = await getFinalSearchResult(organizedSearchResult, summary);   // 최종 검색 결과 생성

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(finalSearchResult)
    });

    return awsServerlessExpress.proxy(server, callback, 'PROMISE').promise;
};

// /**
//  * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
//  */
// exports.handler = (event, context) => {
//   console.log(`EVENT: ${JSON.stringify(event)}`);
//   return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
// };
