// frontend/src/components/finance/WalletPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Statistic,
  Row,
  Col,
  Table,
  Space,
  message,
  Typography,
  Tag,
  Modal,
  Form,
  InputNumber,
  Input
} from 'antd';
import {
  DollarOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  CreditCardOutlined
} from '@ant-design/icons';
import './walletPage.scss';

const { Text } = Typography;

interface Transaction {
  id: number;
  type: 'deposit' | 'withdraw' | 'payment' | 'earning';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState(1200.0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          type: 'earning',
          amount: 250.00,
          description: 'Оплата за задачу #123',
          date: '2024-03-30',
          status: 'completed'
        },
        {
          id: 2,
          type: 'deposit',
          amount: 1000.00,
          description: 'Пополнение баланса',
          date: '2024-03-28',
          status: 'completed'
        },
        {
          id: 3,
          type: 'payment',
          amount: 50.00,
          description: 'Оплата за авторазметку',
          date: '2024-03-25',
          status: 'completed'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      message.error('Ошибка загрузки транзакций');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (values: { amount: number }) => {
    try {
      message.success(`Счет пополнен на ${values.amount} USD`);
      setBalance(prev => prev + values.amount);
      setModalVisible(false);
      form.resetFields();
      loadTransactions();
    } catch (error) {
      message.error('Ошибка при пополнении');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
      case 'withdraw':
        return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
      case 'earning':
        return <DollarOutlined style={{ color: '#2E6B47' }} />;
      default:
        return <CreditCardOutlined />;
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="success">Завершено</Tag>;
      case 'pending':
        return <Tag color="warning">В обработке</Tag>;
      case 'failed':
        return <Tag color="error">Ошибка</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => getTypeIcon(type)
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Transaction) => (
        <Text
          style={{
            color: record.type === 'deposit' || record.type === 'earning' ? '#52c41a' : '#ff4d4f',
            fontWeight: 500
          }}
        >
          {record.type === 'deposit' || record.type === 'earning' ? '+' : '-'} {amount.toFixed(2)} USD
        </Text>
      )
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 120
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status)
    }
  ];

  return (
    <div className="wallet-page">
      {/* УДАЛЕН внутренний заголовок page-header */}

      {/* Balance Card */}
      <Row gutter={[24, 24]} className="balance-row">
        <Col xs={24} lg={12}>
          <Card className="balance-card">
            <div className="balance-content">
              <div className="balance-icon">
                <WalletOutlined />
              </div>
              <div className="balance-info">
                <Text className="balance-label">Текущий баланс</Text>
                <div className="balance-amount">
                  {balance.toFixed(2)} USD
                </div>
              </div>
              <div className="balance-actions">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setModalVisible(true)}
                  className="deposit-btn"
                >
                  Пополнить
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Всего заработано"
              value={1250.00}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#2E6B47' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Всего потрачено"
              value={50.00}
              precision={2}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Активных задач"
              value={3}
              suffix="шт"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Выполнено задач"
              value={12}
              suffix="шт"
            />
          </Card>
        </Col>
      </Row>

      {/* Transactions Table */}
      <Card className="transactions-card" title="История операций">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Deposit Modal */}
      <Modal
        title="Пополнение баланса"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className="deposit-modal"
      >
        <Form form={form} onFinish={handleDeposit} layout="vertical">
          <Form.Item
            label="Сумма пополнения"
            name="amount"
            rules={[{ required: true, message: 'Введите сумму' }]}
          >
            <InputNumber
              min={1}
              max={10000}
              step={10}
              precision={2}
              style={{ width: '100%' }}
              placeholder="Введите сумму в USD"
              addonAfter="USD"
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                Пополнить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WalletPage;
