import http from '../utils/http'

export default class GombocApi {
  // 现在进行中的Gomboc权重
  static getGombocsList(): any {
    return http.get('/light/gombocs/all')
  }
  // 查询投票中的Gombocs权重
  static getGombocsVotiing(): any {
    return http.get('/light/gombocs/votiing')
  }
  // 查询投票历史
  static getVoteHistoryList(params: any): any {
    return http.get('/light/gombocs/getLightGombocController', { params })
  }
  // 查询投票池
  static getGombocsPoolsList(params: any): any {
    return http.get('/light/gombocs/pools', { params })
  }
}
