import { currentMarket } from "./dreamdex"
import { loadSnapshotMarket } from "./market-snapshot"

type MarketLoader = typeof currentMarket
let loader: MarketLoader = loadSnapshotMarket

export const loadAgentMarket = () => loader()
export const setAgentMarketLoaderForTests = (next?: MarketLoader) => { loader = next ?? loadSnapshotMarket }
