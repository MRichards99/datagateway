import {
  FetchDatasetsSuccessType,
  FetchDatasetsSuccessPayload,
  FetchDatasetsFailureType,
  FetchDatasetsFailurePayload,
  FetchDatasetsRequestType,
  FetchDatasetCountRequestType,
  FetchDatasetCountFailureType,
  FetchDatasetCountFailurePayload,
  FetchDatasetCountSuccessType,
  FetchDatasetCountSuccessPayload,
  DownloadDatasetSuccessType,
  DownloadDatasetFailureType,
  DownloadDatasetRequestType,
  DownloadDatasetFailurePayload,
} from './actions.types';
import { Dataset, ActionType, ThunkResult } from '../app.types';
import { source } from '../middleware/dgtable.middleware';
import { Action } from 'redux';
import axios from 'axios';
import { getApiFilter } from '.';
import { fetchDatafileCount } from './datafiles';

export const fetchDatasetsSuccess = (
  datasets: Dataset[]
): ActionType<FetchDatasetsSuccessPayload> => ({
  type: FetchDatasetsSuccessType,
  payload: {
    datasets,
  },
});

export const fetchDatasetsFailure = (
  error: string
): ActionType<FetchDatasetsFailurePayload> => ({
  type: FetchDatasetsFailureType,
  payload: {
    error,
  },
});

export const fetchDatasetsRequest = (): Action => ({
  type: FetchDatasetsRequestType,
});

export const fetchDatasets = (
  investigationId: number
): ThunkResult<Promise<void>> => {
  return async (dispatch, getState) => {
    dispatch(fetchDatasetsRequest());

    let filter = getApiFilter(getState);
    filter.where = {
      ...filter.where,
      INVESTIGATION_ID: investigationId,
    };

    const params = {
      filter,
    };

    await axios
      .get('/datasets', {
        params,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
      })
      .then(response => {
        dispatch(fetchDatasetsSuccess(response.data));
        response.data.forEach((dataset: Dataset) => {
          dispatch(fetchDatafileCount(dataset.ID));
        });
      })
      .catch(error => {
        dispatch(fetchDatasetsFailure(error.message));
      });
  };
};

export const downloadDatasetSuccess = (): Action => ({
  type: DownloadDatasetSuccessType,
});

export const downloadDatasetFailure = (
  error: string
): ActionType<DownloadDatasetFailurePayload> => ({
  type: DownloadDatasetFailureType,
  payload: {
    error,
  },
});

export const downloadDatasetRequest = (): Action => ({
  type: DownloadDatasetRequestType,
});

export const downloadDataset = (
  datasetId: number,
  datasetName: string
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(downloadDatasetRequest());

    // TODO: get this from some sort of settings file
    const idsUrl = '';

    // TODO: get ICAT session id properly when auth is sorted
    const params = {
      sessionId: window.localStorage.getItem('icat:token'),
      datasetIds: datasetId,
      compress: false,
      zip: true,
      outname: datasetName,
    };

    const link = document.createElement('a');
    link.href = `${idsUrl}/getData?${Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}`;

    link.style.display = 'none';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
};

export const fetchDatasetCountSuccess = (
  investigationId: number,
  count: number
): ActionType<FetchDatasetCountSuccessPayload> => ({
  type: FetchDatasetCountSuccessType,
  payload: {
    investigationId,
    count,
  },
});

export const fetchDatasetCountFailure = (
  error: string
): ActionType<FetchDatasetCountFailurePayload> => ({
  type: FetchDatasetCountFailureType,
  payload: {
    error,
  },
});

export const fetchDatasetCountRequest = (): Action => ({
  type: FetchDatasetCountRequestType,
});

export const fetchDatasetCount = (
  investigationId: number
): ThunkResult<Promise<void>> => {
  return async dispatch => {
    dispatch(fetchDatasetCountRequest());

    const params = {
      filter: {
        where: {
          INVESTIGATION_ID: investigationId,
        },
      },
    };

    await axios
      .get('/datasets/count', {
        params,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('daaas:token')}`,
        },
        cancelToken: source.token,
      })
      .then(response => {
        dispatch(fetchDatasetCountSuccess(investigationId, response.data));
      })
      .catch(error => {
        dispatch(fetchDatasetCountFailure(error.message));
      });
  };
};
