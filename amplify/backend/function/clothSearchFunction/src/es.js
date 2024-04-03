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

const getSearchResult = async (queryText, material_query) => {
    const es = esConnect(process.env.ES_CLOUD_PW);

    const query1 = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match": {
                          "종류(소분류)": {
                            "query" : queryText
                          }
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

    const query2 = {
        "query": {
            "bool": {
                "should": [
                    {
                        "match": {
                          "종류(소분류)": {
                            "query" : queryText,
                            "boost": 20
                          }
                        }
                      },
                      {
                        "match": {
                          "소재": {
                            "query" : material_query,
                            "boost": 10
                          }
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

    const query = material_query ? query2 : query1;

    const index = 'clothes_laundry';
    const resp = await es.search({ index, body: query });

    // // 쿼리 결과 처리
    const popularMaterials = resp.aggregations.popular_materials.buckets;
    const howToLaundry = resp.aggregations.how_to_laundry.buckets;

    return { popularMaterials, howToLaundry };
};

module.exports = { getSearchResult };