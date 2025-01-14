// Parent app name and token in localstorage.
export const MicroFrontendId = 'scigateway';
export const MicroFrontendToken = `${MicroFrontendId}:token`;

// TODO: type entities properly; DownloadCartItem does not
//       include string indexing due to DownloadCartTableItem
export interface Investigation {
  ID: number;
  TITLE: string;
  NAME: string;
  VISIT_ID: string;
  RB_NUMBER?: string;
  DOI?: string;
  STARTDATE?: string;
  ENDDATE?: string;
  SUMMARY?: string;
  INVESTIGATIONINSTRUMENT?: InvestigationInstrument[];
  SIZE?: number;
  DATASET_COUNT?: number;
  INVESTIGATIONUSER?: InvestigationUser[];
  SAMPLE?: Sample[];
  PUBLICATION?: Publication[];
  STUDYINVESTIGATION?: StudyInvestigation[];
  FACILITY?: Facility;
  RELEASEDATE?: string;
  DATASET?: Dataset[];
}

export interface Dataset {
  ID: number;
  NAME: string;
  MOD_TIME: string;
  CREATE_TIME: string;
  INVESTIGATION_ID: number;
  DESCRIPTION?: string;
  STARTDATE?: string;
  ENDDATE?: string;
  SIZE?: number;
  DATAFILE_COUNT?: number;
  DATASETTYPE?: DatasetType;
  DOI?: string;
  COMPLETE?: boolean;
}

export interface Datafile {
  ID: number;
  NAME: string;
  MOD_TIME: string;
  CREATE_TIME: string;
  DATASET_ID: number;
  FILESIZE?: number;
  LOCATION?: string;
  DESCRIPTION?: string;
  DATAFILEPARAMETER?: DatafileParameter[];
}

export interface InvestigationInstrument {
  ID: number;
  INSTRUMENT_ID: number;
  INVESTIGATION_ID: number;
  INSTRUMENT?: Instrument;
  INVESTIGATION?: Investigation;
}

export interface Instrument {
  ID: number;
  NAME: string;
  FULLNAME?: string;
  DESCRIPTION?: string;
  TYPE?: string;
  URL?: string;
  INSTRUMENTSCIENTIST?: InstrumentScientist[];
  FACILITY_ID: number;
  FACILITY?: Facility;
}

export interface InvestigationUser {
  ID: number;
  USER_ID: number;
  INVESTIGATION_ID: number;
  ROLE: string;
  USER_?: User;
  INVESTIGATION?: Investigation;
}

export interface User {
  ID: number;
  NAME: string;
  FULLNAME?: string;
}

export interface Sample {
  ID: number;
  NAME: string;
  INVESTIGATION_ID: number;
}

export interface Publication {
  ID: number;
  FULLREFERENCE: string;
}

export interface FacilityCycle {
  ID: number;
  NAME: string;
  DESCRIPTION?: string;
  STARTDATE?: string;
  ENDDATE?: string;
  FACILITY_ID: number;
  FACILITY?: Facility;
}

export interface DatasetType {
  ID: number;
  NAME: string;
  DESCRIPTION?: string;
}

export interface StudyInvestigation {
  ID: number;
  STUDY_ID: number;
  INVESTIGATION_ID: number;
  STUDY: Study;
  INVESTIGATION?: Investigation;
}

interface Study {
  ID: number;
  PID: string;
  NAME: string;
  MOD_TIME: string;
  CREATE_TIME: string;
  DESCRIPTION?: string;
  STARTDATE?: string;
  ENDDATE?: string;
}

interface InstrumentScientist {
  ID: number;
  INSTRUMENT_ID: number;
  USER_ID: number;
  INSTRUMENT?: Instrument;
  USER_?: User;
}

interface DatafileParameter {
  ID: number;
  STRING_VALUE?: string;
  NUMERIC_VALUE?: number;
  DATETIME_VALUE?: string;
  RANGEBOTTOM?: number;
  RANGETOP?: number;
  DATAFILE_ID: number;
  PARAMETER_TYPE_ID: number;
  DATAFILE?: Datafile;
  PARAMETERTYPE: ParameterType;
}

interface ParameterType {
  ID: number;
  NAME: string;
  UNITS: string;
  VALUETYPE: string;
}

interface Facility {
  ID: number;
  NAME: string;
  FULLNAME?: string;
  URL?: string;
  DESCRIPTION?: string;
  DAYSUNTILRELEASE?: number;
  FACILITYCYCLE?: FacilityCycle[];
}

export interface DownloadCartItem {
  entityId: number;
  entityType: 'investigation' | 'dataset' | 'datafile';
  id: number;
  name: string;
  parentEntities: DownloadCartItem[];
}

export interface DownloadItem {
  entityId: number;
  entityType: 'investigation' | 'dataset' | 'datafile';
  id: number;
}

export interface DownloadCart {
  cartItems: DownloadCartItem[];
  createdAt: string;
  facilityName: string;
  id: number;
  updatedAt: string;
  userName: string;
}

export interface Download {
  createdAt: string;
  downloadItems: DownloadItem[];
  facilityName: string;
  fileName: string;
  fullName: string;
  id: number;
  isDeleted: boolean;
  isEmailSent: boolean;
  isTwoLevel: boolean;
  preparedId: string;
  sessionId: string;
  size: number;
  status: 'PREPARING' | 'RESTORING' | 'PAUSED' | 'COMPLETE' | 'EXPIRED';
  transport: string;
  userName: string;
  email?: string;

  [key: string]: string | number | boolean | DownloadItem[] | undefined;
}

export interface FormattedDownload
  extends Omit<Download, 'status' | 'isDeleted'> {
  isDeleted: string;
  status: string;
}

export interface SubmitCart {
  cartItems: DownloadCartItem[];
  facilityName: string;
  downloadId: number;
  userName: string;
}

export type DownloadCartTableItem = DownloadCartItem & {
  size: number;
  [key: string]: string | number | DownloadCartItem[];
};

export type ICATEntity =
  | Investigation
  | Dataset
  | Datafile
  | Instrument
  | FacilityCycle
  | StudyInvestigation;

export type Entity = (
  | ICATEntity
  | DownloadCartTableItem
  | Download
  | FormattedDownload
) & {
  // We will have to ignore the any typing here to access
  // Entity attributes with string indexing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export const EntityTypes: string[] = [
  'investigation',
  'dataset',
  'datafile',
  'facilityCycle',
  'instrument',
  'facility',
  'study',
];

// TODO: type these properly
export interface DateFilter {
  startDate?: string;
  endDate?: string;
}

export interface TextFilter {
  value?: string | number;
  type: string;
}

export type Filter = string[] | TextFilter | DateFilter;

export type Order = 'asc' | 'desc';

export interface FiltersType {
  [column: string]: Filter;
}

export interface SortType {
  [column: string]: Order;
}
