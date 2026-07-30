# Tracker Metadata

## Contents

- Statuses
- Issue Types
- Resolutions
- Components
- Common Fields
- Time Tracking Fields
- Agile Fields
- Email Fields
- Comment Counters

Use this reference with `../SKILL.md` when exact Tracker keys are needed.

## Statuses

| Name | English name | Global type | Key |
| --- | --- | --- | --- |
| Открыт | Open | Начальный | `open` |
| Требуется информация | Need Info | На паузе | `needInfo` |
| В работе | In Progress | В процессе | `inProgress` |
| Тестируется | Testing | В процессе | `testing` |
| Протестировано | Tested | На паузе | `tested` |
| Ревью | In Review | На паузе | `inReview` |
| Решен | Resolved | Завершен | `resolved` |
| Закрыт | Closed | Завершен | `closed` |
| Готово к релизу | Ready for release | На паузе | `rc` |
| Беклог | Backlog | Начальный | `backlog` |
| Будем делать | Selected for dev | Начальный | `selectedForDev` |
| Можно тестировать | Ready For Test | На паузе | `readyForTest` |
| Ждем подтверждения | Need Acceptance | На паузе | `needAcceptance` |
| Отменено | Cancelled | Отменен | `cancelled` |
| Подтверждён | Confirmed | На паузе | `confirmed` |
| Оценка задачи | Need estimate | На паузе | `needEstimate` |
| Демонстрация заказчику | Demonstration to customer | На паузе | `demoToCustomer` |
| Первая линия поддержки | 1 line of support | В процессе | `firstSupportLine` |
| Вторая линия поддержки | 2 line of support | В процессе | `secondSupportLine` |
| Новый | New | Начальный | `new` |
| Документы подготовлены | Documents prepared | На паузе | `documentsPrepared` |
| Приостановлено | On Hold | На паузе | `onHold` |
| Согласование результата | Result Acceptance | На паузе | `resultAcceptance` |
| Новая цель | New goal | Начальный | `newGoal` |
| По плану | As planned | В процессе | `asPlanned` |
| Есть риски | With risks | На паузе | `withRisks` |
| Достигнута | Achieved | Завершен | `achieved` |
| Цель заблокирована | Blocked goal | На паузе | `blockedGoal` |

Goal statuses (`newGoal`, `asPlanned`, `withRisks`, `achieved`, `blockedGoal`) are normally used with goal tools rather than issue execution.

## Issue Types

| Name | English name | Key |
| --- | --- | --- |
| Ошибка | Bug | `bug` |
| Задача | Task | `task` |
| Новая возможность | New Feature | `newFeature` |
| Улучшение | Improvement | `improvement` |
| Рефакторинг | Refactoring | `refactoring` |
| Epic | Epic | `epic` |
| Story | Story | `story` |
| Change request | Change request | `changeRequest` |
| Инцидент | Incident | `incident` |
| Запрос на обслуживание | Service request | `serviceRequest` |
| Релиз | Release | `release` |
| Проект | Project | `project` |
| Отсутствие | Leave | `leave` |
| Командировка | Business Trip | `businessTrip` |
| Изменения | Changes | `changes` |
| Документы | Documents | `documents` |
| Запрос | Request | `request` |
| Вакансия | Vacancy | `vacancy` |
| Кандидат | Applicant | `applicant` |
| Цель | Goal | `goal` |
| Веха | Milestone | `milestone` |

## Resolutions

| Name | English name | Key |
| --- | --- | --- |
| Решен | Fixed | `fixed` |
| Не будет исправлено | Won't fix | `wontFix` |
| Не воспроизводится | Can't reproduce | `cantReproduce` |
| Дубликат | Duplicate | `duplicate` |
| Позже | Later | `later` |
| Перевыполнено | Overfulfilled | `overfulfilled` |
| Успешно | Successful | `successful` |
| Не делаем | Don't do | `dontDo` |

## Components

Confirmed queue `SF` components:

| Name | ID |
| --- | --- |
| Backend | `2` |
| Control | `4` |
| Frontend | `1` |
| Mobile | `5` |
| SaaS | `3` |

## Common Fields

| Name | English name | Type | Key |
| --- | --- | --- | --- |
| QA-инженер | QA-Engineer | Пользователь | `qaEngineer` |
| Автор | Author | Пользователь | `author` |
| Возможно спам | Possible spam | Целое число | `possibleSpam` |
| Дата завершения | End Date | Дата | `end` |
| Дата начала | Start Date | Дата | `start` |
| Дедлайн | Deadline | Дата | `dueDate` |
| Доски | Boards | Доски задач | `boards` |
| Доступ | Access | Пользователь | `access` |
| Задача | Summary | Строка | `summary` |
| Изменил | Modifier | Пользователь | `modifier` |
| Исполнитель | Assignee | Пользователь | `assignee` |
| Исправить в версиях | Fix Version | Версия | `fixVersions` |
| Ключ | Key | Строка | `key` |
| Компоненты | Components | Компонент | `components` |
| Наблюдатели | Followers | Пользователь | `followers` |
| Найдено в версиях | Affected Version | Версия | `affectedVersions` |
| Нужен ответ пользователя | Pending reply from | Пользователь | `pendingReplyFrom` |
| Обновлено | Updated | Время и дата | `updated` |
| Описание | Description | Текст | `description` |
| Очередь | Queue | Очередь | `queue` |
| Пользователь получил ответ | Received reply for | Пользователь | `receivedReplyFor` |
| Последний комментарий | Last Comment | Время и дата | `lastCommentUpdatedAt` |
| Предыдущая очередь | Previous queue | Очередь | `lastQueue` |
| Приоритет | Priority | Приоритет | `priority` |
| Проголосовали | Voted By | Пользователь | `votedBy` |
| Проголосовало | Votes | Целое число | `votes` |
| Проект | Project | Мультипроект | `project` |
| Разрешен | Resolved | Время и дата | `resolved` |
| Рассылки | Maillists | Рассылка | `followingMaillists` |
| Резолюция | Resolution | Резолюция | `resolution` |
| Решивший | Resolver | Пользователь | `resolver` |
| Родительский тикет | Parent issue | Задача | `parent` |
| Связанные цели | Linked goals | field-type--multigoal | `linkedGoals` |
| Создано | Created | Время и дата | `created` |
| Старая очередь | Old Queue | Очередь | `previousQueue` |
| Статус | Status | Статус | `status` |
| Статус изменен | Last status change | Время и дата | `statusStartTime` |
| Суммарный процент участия | Participant percents total | Дробное число | `participantPercentsTotal` |
| Теги | Tags | Теги | `tags` |
| Тип | Type | Тип задачи | `type` |
| Тип статуса | Status type | field-type--statustype | `statusType` |

## Time Tracking Fields

| Name | English name | Type | Key |
| --- | --- | --- | --- |
| Затрачено времени | Time Spent | Продолжительность | `spent` |
| Оценка | Estimate | Продолжительность | `estimation` |
| Первоначальная оценка | Original Estimate | Продолжительность | `originalEstimation` |

## Agile Fields

| Name | English name | Type | Key |
| --- | --- | --- | --- |
| Epic | Epic | Задача | `epic` |
| Story Points | Story Points | Дробное число | `storyPoints` |
| Спринт | Sprint | Спринт | `sprint` |

## Email Fields

| Name | English name | Type | Key |
| --- | --- | --- | --- |
| Кому | Email To | Строка | `emailTo` |
| Копия | Email Cc | Строка | `emailCc` |
| От | Email From | Строка | `emailFrom` |
| Создано по письму на адрес | Created By email to | Строка | `emailCreatedBy` |

## Comment Counters

| Name | English name | Type | Key |
| --- | --- | --- | --- |
| Комментариев без сообщения | Number of comments without message | Целое число | `commentWithoutExternalMessageCount` |
| Комментариев с сообщением | Number of comments with message | Целое число | `commentWithExternalMessageCount` |
