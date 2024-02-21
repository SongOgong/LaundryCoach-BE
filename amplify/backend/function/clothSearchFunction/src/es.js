const { Client } = require('@elastic/elasticsearch');

const esConnect = (apiKey) => {
    const es = new Client({
        node: process.env.ES_ENDPOINT,
        auth: {
            username: 'laundrycoach-user',
            password: apiKey,
            roles : [ "laundry-coach-user" ]
        }
    });
    return es;
};

const getSearchResult = async (queryText) => {
    const es = esConnect(process.env.ES_CLOUD_PW);

    const query = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match": {
                            "종류(소분류)": queryText
                        }
                    }
                ]
            }
        },
        "size": 0,
        "aggs": {
            "popular_materials": {
                "terms": {
                    "field": "소재",
                    "size": 3
                }
            },
            "how_to_laundry": {
                "terms": {
                    "field": "세탁방법",
                    "size": 5
                }
            }
        }
    };

    const index = 'clothes_laundry';
    const resp = await es.search({ index, body: query });

    // // 쿼리 결과 처리
    const popularMaterials = resp.aggregations.popular_materials.buckets;
    const howToLaundry = resp.aggregations.how_to_laundry.buckets;

    return { popularMaterials, howToLaundry };
};

module.exports = { getSearchResult };