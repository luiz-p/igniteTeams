import { useEffect, useRef, useState } from 'react'

import { Alert, FlatList, TextInput } from 'react-native'

import { Button } from '@components/Button'
import { ButtonIcon } from '@components/ButtonIcon'
import { Filter } from '@components/Filter'
import { Header } from '@components/Header'
import { Highlight } from '@components/Highlight'
import { Input } from '@components/Input'
import { ListEmpty } from '@components/ListEmpty'
import { PlayerCard } from '@components/PlayerCard'
import { useNavigation, useRoute } from '@react-navigation/native'
import { groupRemoveByName } from '@storage/group/groupRemoveByName'
import { playerAddByGroup } from '@storage/player/playerAddByGroup'
import { playerRemoveByGroup } from '@storage/player/playerRemoveByGroup'
import {
  playersGetByGroupAndTeam
} from '@storage/player/playersGetByGroupAndTeam'
import { PlayerStorageDTO } from '@storage/player/PlayerStorageDTO'

import { AppError } from '../../utils/AppError'
import {
  Container,
  Form,
  HeaderList,
  NumberOfPlayers
} from './styles'

type RouteParams = {
  group: string;
}

export function Players () {
  const [team, setTeam] = useState('Time A')
  const [players, setPlayers] = useState<PlayerStorageDTO[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')

  const route = useRoute()
  const navigation = useNavigation()
  const { group } = route.params as RouteParams
  const newPlayerNameInputRef = useRef<TextInput>(null)

  async function handleAddPlayer () {
    if (newPlayerName.trim().length === 0) {
      return Alert.alert('Nova pessoa', 'Infome o nome da pessoa para adicionar.')
    }
    const newPlayer = {
      name: newPlayerName,
      team
    }

    try {
      await playerAddByGroup(newPlayer, group)

      newPlayerNameInputRef.current?.blur()

      setNewPlayerName('')
      fetchPlayerByTeam()
    } catch (error) {
      if (error instanceof AppError) {
        Alert.alert('Nova pessoa', error.message)
      } else {
        Alert.alert('Nova pessoa', 'Não foi possível adicionar.')
      }
    }
  }

  async function fetchPlayerByTeam () {
    try {
      const playerByTeam = await playersGetByGroupAndTeam(group, team)
      setPlayers(playerByTeam)
    } catch (error) {
      Alert.alert('Pessoas', 'Não foi possível carregar as pessoas do time selecionado.')
    }
  }

  async function handlePlayerRemove (playerName: string) {
    try {
      await playerRemoveByGroup(playerName, group)
      fetchPlayerByTeam()
    } catch (error) {
      Alert.alert('Remover Pessoa', 'Não foi possível remover essa pessoa.')
    }
  }

  async function groupRemove () {
    try {
      await groupRemoveByName(group)
      navigation.navigate('groups')
    } catch (error) {
      Alert.alert('Remover grupo', 'Não foi possível remover o grupo')
    }
  }

  async function handleGroupRemove () {
    Alert.alert(
      'Remover',
      'Deseja remover o grupo?',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: () => groupRemove() }
      ]
    )
  }

  useEffect(() => {
    fetchPlayerByTeam()
  }, [team])

  return (
    <Container>
      <Header showBackButton />

      <Highlight
        title={group}
        subtitle="adicione a galera e separe os times"
      />

      <Form>
        <Input
          inputRef={newPlayerNameInputRef}
          onChangeText={setNewPlayerName}
          value={newPlayerName}
          placeholder="Nome da pessoa"
          autoCorrect={false}
          onSubmitEditing={handleAddPlayer}
          returnKeyType="done"
        />

        <ButtonIcon
          icon="add"
          onPress={handleAddPlayer}
        />
      </Form>

      <HeaderList>
        <FlatList
          data={['Time A', 'Time B']}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <Filter
              title={item}
              isActive={item === team}
              onPress={() => setTeam(item)}
            />
          )}
          horizontal
        />

        <NumberOfPlayers>
          {players.length}
        </NumberOfPlayers>
      </HeaderList>

      <FlatList
        data={players}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <PlayerCard
            name={item.name}
            onRemove={() => handlePlayerRemove(item.name)}
          />
        )}
        ListEmptyComponent={() => (
          <ListEmpty message="Não há pessoas nesse time" />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: 100 }, players.length === 0 && { flex: 1 }]}
      />

      <Button
        title="Remover Turma"
        type="SECONDARY"
        onPress={handleGroupRemove}
      />
    </Container>
  )
}
