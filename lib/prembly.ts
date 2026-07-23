// lib/prembly.ts
import axios from 'axios';

const PREMBLY_SECRET_KEY = process.env.PREMBLY_SECRET_KEY;

export interface PremblyResponse {
  status: boolean;
  message: string;
  detail: string;
  response_code: string;
  data: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const premblyClient = axios.create({
  baseURL: 'https://api.prembly.com',
  timeout: 30000,
});

// BVN Response Types
export interface BVNResponse {
  status: boolean;
  message: string;
  detail: string;
  response_code: string;
  data: {
    kyc: {
      lastName: string;
      firstName: string;
      middleName: string;
      dateOfBirth: string;
      phoneNumber: string;
    };
    report: string;
    created_at: string;
    search_name: string;
    profile_status: string;
    screening_result?: {
      tooltips: string[];
      risk_rank: 'LOW' | 'MEDIUM' | 'HIGH';
      final_risk_score: number;
    };
  };
}

// NIN Response Types
export interface NINResponse {
  status: boolean;
  message: string;
  detail: string;
  response_code: string;
  data: {
    kyc: {
      nin: string;
      photo: string;
      title: string;
      gender: string;
      heigth: string;
      report: string;
      nok_lga: string;
      surname: string;
      nok_town: string;
      religion: string;
      birthdate: string;
      centralID: string;
      firstname: string;
      nok_state: string;
      signature: string;
      middlename: string;
      profession: string;
      trackingId: string;
      nok_surname: string;
      telephoneno: string;
      birthcountry: string;
      nok_address1: string;
      maritalstatus: string;
      nok_firstname: string;
      residence_lga: string;
      nok_middlename: string;
      residence_town: string;
      residence_state: string;
      residencestatus: string;
      spoken_language: string;
      educationallevel: string;
      employmentstatus: string;
      residence_address: string;
    };
    report: string;
    created_at: string;
    search_name: string;
    profile_status: string;
    screening_result?: {
      tooltips: string[];
      risk_rank: 'LOW' | 'MEDIUM' | 'HIGH';
      final_risk_score: number;
    };
  };
}

// CAC Response Types
export interface CACResponse {
  status: boolean;
  message: string;
  detail: string;
  response_code: string;
  data: {
    business_info?: {
      company_name: string;
      name: string;
      address: string;
      registrationDate: string;
      company_status: string;
      companyStatus: string;
      directors: Array<{
        surname: string;
        firstname: string;
        email: string;
        phoneNumber: string;
        accreditationnumber: string;
        status: string;
        address: string;
      }>;
    };
    report?: string;
    screening_result?: {
      tooltips: string[];
      risk_rank: 'LOW' | 'MEDIUM' | 'HIGH';
      final_risk_score: number;
    };
  };
}

// Business Screening Response Types
export interface BusinessScreeningResponse {
  status: boolean;
  message: string;
  detail: string;
  response_code: string;
  data: {
    business_info?: {
      company_name: string;
      name: string;
      address: string;
      registrationDate: string;
      company_status: string;
      companyStatus: string;
      directors: Array<{
        surname: string;
        firstname: string;
        email: string;
        phoneNumber: string;
        accreditationnumber: string;
        status: string;
        address: string;
      }>;
    };
    business_persons_pep_sanction?: any[];
    sanction?: Array<{
      name: string;
      summary: string;
      other_information?: {
        type: string;
        rc: string;
        date_of_registration: string;
        address: string;
        reason_for_designation: string;
      };
    }>;
    adverse_media?: Array<Array<{
      title: string;
      content: string;
      link: string;
      thumbnail: string;
    }>>;
    overall_sentiment?: {
      overall_sentiment: string;
      scores: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
    screening_result?: {
      final_risk_score: number;
      risk_rank: 'LOW' | 'MEDIUM' | 'HIGH';
      toolkit: string[];
      tooltips: string[];
      rank_description: string;
      applied_rules: {
        name_rules: Array<{
          rule: string;
          condition: string;
          entity_key: string;
          value: boolean;
          score: number;
        }>;
      };
      ai_analysis: {
        ai_analysis: string;
        category: string;
        reason: string;
      };
    };
    id_response?: any;
    report?: string;
  };
}

// Helper function to safely access nested properties
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return (result === undefined || result === null) ? defaultValue : result;
}