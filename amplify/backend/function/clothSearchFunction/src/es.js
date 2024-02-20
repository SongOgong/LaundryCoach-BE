const { Client } = require('@elastic/elasticsearch');

const esConnect = (cid, user, passwd) => {
    const es = new Client({ cloud: { id: cid }, auth: { username: user, password: passwd } });
    return es;
};

const getSearchResult = async (queryText) => {
    const cid = process.env.ES_CLOUD_ID;
    const cu = process.env.ES_CLOUD_USER;
    const cp = process.env.ES_CLOUD_PASSWD;
    const es = esConnect(cid, cu, cp);

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

    // 쿼리 결과 처리
    const popularMaterials = resp.body.aggregations.popular_materials.buckets;
    const howToLaundry = resp.body.aggregations.how_to_laundry.buckets;

    return { popularMaterials, howToLaundry };
};