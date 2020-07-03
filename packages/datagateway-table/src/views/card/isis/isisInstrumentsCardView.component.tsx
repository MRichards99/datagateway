import React from 'react';
import CardView from '../cardView.component';
import { StateType } from '../../../state/app.types';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { connect } from 'react-redux';
import {
  Entity,
  fetchInstrumentCount,
  fetchInstruments,
  fetchInstrumentDetails,
  Instrument,
  tableLink,
} from 'datagateway-common';
import { IndexRange } from 'react-virtualized';
import { ViewsType } from 'datagateway-common/lib/state/app.types';
import { Link } from '@material-ui/core';
import InstrumentDetailsPanel from '../../detailsPanels/isis/instrumentDetailsPanel.component';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface ISISInstrumentsCVDispatchProps {
  fetchData: (offsetParams: IndexRange) => Promise<void>;
  fetchCount: () => Promise<void>;
  fetchDetails: (instrumentId: number) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface ISISInstrumentsCVStateProps {
  data: Entity[];
  totalDataCount: number;
  view: ViewsType;
}

type ISISInstrumentsCVCombinedProps = ISISInstrumentsCVDispatchProps &
  ISISInstrumentsCVStateProps;

const ISISInstrumentsCardView = (
  props: ISISInstrumentsCVCombinedProps
): React.ReactElement => {
  const {
    data,
    totalDataCount,
    fetchData,
    fetchCount,
    fetchDetails,
    view,
  } = props;

  const [fetchedCount, setFetchedCount] = React.useState(false);

  React.useEffect(() => {
    // Load count to trigger data to be fetched.
    if (!fetchedCount) {
      fetchCount();
      setFetchedCount(true);
    }
  }, [data, fetchedCount, fetchCount, setFetchedCount]);

  return (
    <CardView
      data={data}
      totalDataCount={totalDataCount}
      loadData={fetchData}
      loadCount={fetchCount}
      title={{
        dataKey: 'FULLNAME',
        content: (instrument: Instrument) =>
          tableLink(
            `/browse/instrument/${instrument.ID}/facilityCycle`,
            instrument.FULLNAME || instrument.NAME,
            view
          ),
      }}
      description={{ dataKey: 'DESCRIPTION' }}
      information={[
        {
          label: 'Type',
          dataKey: 'TYPE',
        },
        {
          label: 'URL',
          dataKey: 'URL',
          // eslint-disable-next-line react/display-name
          content: (instrument: Instrument) => (
            <Link href={instrument.URL}>{instrument.URL}</Link>
          ),
        },
      ]}
      moreInformation={(instrument: Instrument) => (
        <InstrumentDetailsPanel
          rowData={instrument}
          fetchDetails={fetchDetails}
        />
      )}
    />
  );
};

const mapStateToProps = (state: StateType): ISISInstrumentsCVStateProps => {
  return {
    data: state.dgcommon.data,
    totalDataCount: state.dgcommon.totalDataCount,
    view: state.dgcommon.query.view,
  };
};

const mapDispatchToProps = (
  dispatch: ThunkDispatch<StateType, null, AnyAction>
): ISISInstrumentsCVDispatchProps => ({
  fetchData: (offsetParams: IndexRange) =>
    dispatch(fetchInstruments(offsetParams)),
  fetchCount: () => dispatch(fetchInstrumentCount()),
  fetchDetails: (instrumentId: number) =>
    dispatch(fetchInstrumentDetails(instrumentId)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ISISInstrumentsCardView);