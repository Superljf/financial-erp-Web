export interface Company {
  id: number;
  tax: string;
  name: string;
  account: string;
  pwd: string;
  found: string;
  cancel: string;
}

export interface AccountRow {
  年月: string;
  公司名称: string;
  纳税人识别号: string;
  类型: string;
  学员编号: string;
  学生姓名: string;
  上月剩余: number;
  应付: number;
  转出: number;
  预收: number;
  退款: number;
  理赔: number;
  课耗: number;
  本月剩余: number;
}

export interface CashRow {
  id: string;
  年月: string;
  公司名称: string;
  纳税人识别号: string;
  交易日期: string;
  交易渠道: string;
  交易金额: number;
  清算金额: number;
  手续费: number;
  团队: string;
  业务校区: string;
  学生姓名: string;
  学员编号: string;
  现金: number | '';
  转账: number | '';
  刷卡: number | '';
  在线支付: number | '';
  单据编号: string;
  客户账号: string;
  类型: '预收学费' | '预收退款';
}

export interface ConsumeRow {
  id: string;
  年月: string;
  公司名称: string;
  纳税人识别号: string;
  考勤日期: string;
  学生姓名: string;
  学员编号: string;
  课耗金额: number;
  消耗课时: number | '';
  课时长度: number | '';
  课程名称: string;
  课程类型: string;
  课程子类型: string;
  课程年级: string;
  科目: string;
  课程季: string;
  上课日期: string;
  上课时间: string;
  教师: string;
  教师编码: string;
}

export interface StudentBrief {
  code: string;
  name: string;
}

export const GRADES = [
  '幼儿园小班',
  '幼儿园中班',
  '幼儿园大班',
  '一年级',
  '二年级',
  '三年级',
  '四年级',
  '五年级',
  '六年级',
  '初一',
  '初二',
  '初三',
  '高一',
  '高二',
  '高三',
];

export const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
