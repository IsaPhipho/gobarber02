import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';

import { HighLightCard } from '../../components/HighLightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import { 
  Container, 
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighLightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer
} from './styles';

export interface DataListProps extends TransactionCardProps {
  id: string;
}

interface HighLightProps {
  amount: string;
  lastTransaction: string;
}

interface HighLightData {
  entries: HighLightProps;
  expensives: HighLightProps;
  total: HighLightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[] >([]);
  const [highLightData, setHighLightData] = useState<HighLightData>({} as HighLightData);

  const theme = useTheme();

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative' 
  ){
    const lastTransaction = new Date(
    Math.max.apply(Math, collection
    .filter(transaction => transaction.type === type)
    .map(transaction => new Date(transaction.date).getTime())))
    
    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long' })}`;
  }

  async function loadTransactions(){
    const dataKey = '@gofinances:transactions';
    const response = await AsyncStorage.getItem(dataKey);
    const storagedTransactions  = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensivesTotal = 0;

    const transactionsFormatted: DataListProps[] = storagedTransactions
    .map((item: DataListProps) => {

      if(item.type === 'positive'){
        entriesTotal += Number(item.amount);
      }else {
        expensivesTotal += Number(item.amount);
      }

      const amount = Number(item.amount)
      .toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date));

      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,  
        category: item.category,
        date
      }
    });

    setTransactions(transactionsFormatted);
    const lastTransactionEntries = getLastTransactionDate(transactions, 'positive')
    const lastTransactionExpensives = getLastTransactionDate(transactions, 'negative')
    const totalInterval = `01 a ${lastTransactionExpensives}`

    const total = entriesTotal - expensivesTotal;

    setHighLightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última entrada dia ${lastTransactionEntries}`,
      },
      expensives: {
        amount: expensivesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última saída dia ${lastTransactionExpensives}`,
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    });

    setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();

    // const dataKey = '@gofinances:transactions';   // para limpar listagem
    // AsyncStorage.removeItem(dataKey);

  },[]);

  useFocusEffect(useCallback(() => {
    loadTransactions();
  },[]));

  return (
    <Container>
      {
        isLoading ? 
        <LoadContainer>
          <ActivityIndicator 
            color={theme.colors.primary}
            size="large"
          />
        </LoadContainer> :
        <>  
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{ uri: 'https://avatars.githubusercontent.com/u/47599339?v=4}'}}
                />
                <User>
                  <UserGreeting>Olá,</UserGreeting>
                  <UserName>Tiago</UserName>
                </User>
              </UserInfo>
                <LogoutButton onPress={() => {}}>
                  <Icon name="power"/>
                </LogoutButton>
            </UserWrapper>
          </Header>
          <HighLightCards>
            <HighLightCard 
              type="up"
              title="Entradas" 
              amount={highLightData?.entries?.amount} 
              lastTransaction={highLightData.entries.lastTransaction} 
            />
            <HighLightCard 
              type="down"
              title="Saídas" 
              amount={highLightData?.expensives?.amount} 
              lastTransaction={highLightData.expensives.lastTransaction} 
            />
            <HighLightCard 
              type="total"
              title="Total" 
              amount={highLightData?.total?.amount}  
              lastTransaction="01 a 16 de abril"
            />
          </HighLightCards>
          <Transactions>
            <Title>Listagem</Title>
            <TransactionList 
              data={transactions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
            
          </Transactions>
        </>
      }
    </Container>  
  )
}