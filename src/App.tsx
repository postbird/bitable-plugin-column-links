import "./App.css";
import { bitable, ITableMeta } from "@lark-base-open/js-sdk";
import {
  Button,
  Form,
  Select,
  Alert,
  message,
  Input,
  Space,
  Card,
  Tooltip,
  Switch,
  Tabs,
  TabsProps,
  List,
  Typography,
} from "antd";
import { useState, useEffect, useMemo } from "react";
import { CopyOutlined } from "@ant-design/icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { filerLinks } from "./utils";

const getTabOptions = (linkList: any = []): TabsProps["items"] => {
  const displayLinkList = JSON.stringify(linkList, null, 2);
  return [
    {
      key: "list",
      label: "List View",
      children: (
        <div style={{ marginTop: 16 }}>
          <List
            dataSource={linkList}
            renderItem={(item: any, index) => (
              <List.Item key={`${item}_${index}`}>
                <Typography.Text ellipsis={{ tooltip: item }} title={item}>
                  {item}
                </Typography.Text>
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: "json",
      label: "JSON View",
      children: (
        <div style={{ marginTop: 16 }}>
          <Input.TextArea
            rows={10}
            style={{ resize: "vertical" }}
            value={displayLinkList}
          />
        </div>
      ),
    },
  ];
};

export default function App() {
  const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const [tableOptions, setTableOptions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([
      bitable.base.getTableMetaList(),
      bitable.base.getSelection(),
    ]).then(([metaList, selection]) => {
      setTableMetaList(metaList);
    });
  }, []);

  useEffect(() => {
    if (Array.isArray(tableMetaList)) {
      const newOptions = tableMetaList.map(({ name, id }) => {
        return {
          value: id,
          label: name,
        };
      });
      setTableOptions(newOptions);
    }
  }, [tableMetaList]);

  const handleOnTableSelectChange = async (tableId: string) => {
    const table = await bitable.base.getTableById(tableId);

    const fieldList = await table.getFieldMetaList();

    const options = fieldList?.map((item) => ({
      value: item.id,
      label: item.name,
      field: item,
    }));

    setFieldOptions(options);

    form.setFieldValue("tableId", tableId);
  };

  const handleOnClick = async () => {
    try {
      setLoading(true);
      await form.validateFields();
      const formValues = form.getFieldsValue();
      const fieldId = formValues.fieldId;
      const fieldInfo = fieldOptions.find(
        (item) => item.value === fieldId
      )?.field;
      if (!fieldInfo) {
        message.error("get field failed or field not exited");
      }
      const tableId = formValues.tableId;

      const table = await bitable.base.getTableById(tableId);
      console.log("table", table);

      const textField = await table.getField(fieldId);
      console.log("textField", textField);

      const recordIdList = await table.getRecordIdList();
      console.log("recordIdList", recordIdList);

      const promises = recordIdList.map((recordId) =>
        textField.getValue(recordId)
      );

      Promise.allSettled(promises).then((promiseResList) => {
        const _results = promiseResList.map((item) => {
          return item.status === "fulfilled" ? item.value : item.reason;
        });
        console.log("_results", _results);
        setResults(_results);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const linkList = useMemo(() => {
    if (!results || !results.length) {
      return [];
    }

    const _linkList: string[] = [];

    results
      .filter((item) => Boolean(item) && Array.isArray(item))
      .forEach((textArr: any[]) => {
        console.log("textArrtextArr", textArr);
        textArr?.forEach((item) => {
          if (item.link) {
            _linkList.push(item.link);
          }
        });
      });

    const filteredLinks = filerLinks(
      _linkList,
      form.getFieldValue("onlyLarkDoc")
    );

    console.log("_linkList", _linkList, filteredLinks);
    return filteredLinks;
  }, [results]);

  const matchResult = useMemo(() => {
    return {
      total: results?.length,
      matched: linkList?.length,
    };
  }, [linkList, results]);

  const displayLinkList = useMemo(() => {
    return JSON.stringify(linkList, null, 2);
  }, [linkList]);

  const allowToAction = linkList?.length >= 1;

  return (
    <main className="main">
      <div style={{ marginBottom: 16 }}>
        <Alert
          style={{ padding: "6px 12px" }}
          banner
          showIcon={false}
          type="info"
          description="Help you quickly get the links of lark doc by table and column"
        />
      </div>
      <Form layout="vertical" form={form}>
        <Form.Item
          name="tableId"
          label="Select Data Table"
          required
          rules={[{ required: true, message: "please select the table" }]}
        >
          <Select
            style={{ width: "100%" }}
            placeholder="select a Table"
            options={tableOptions}
            onChange={handleOnTableSelectChange}
          />
        </Form.Item>
        {!fieldOptions?.length ? null : (
          <>
            <Form.Item
              name="fieldId"
              label="Select Table Column"
              required
              rules={[{ required: true, message: "please select the column" }]}
            >
              <Select
                style={{ width: "100%" }}
                placeholder="select a column"
                options={fieldOptions}
              />
            </Form.Item>
            <Form.Item
              labelAlign="left"
              name="onlyLarkDoc"
              label="Only Lark Docs?"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
          </>
        )}
        <Button type="primary" onClick={handleOnClick} loading={loading}>
          Submit
        </Button>
      </Form>
      <Card
        size="small"
        loading={loading}
        title={
          <Space>
            <span>Results</span>
            <Tooltip title="Click to copy as JSON structure">
              <CopyToClipboard
                onCopy={() => message.success("Copied")}
                text={displayLinkList}
              >
                <Button
                  type="link"
                  icon={<CopyOutlined />}
                  disabled={!allowToAction}
                />
              </CopyToClipboard>
            </Tooltip>
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        <div>
          <Space>
            Valid Records:{matchResult.matched} / Total Records:{" "}
            {matchResult.total}
          </Space>
        </div>
        <Tabs items={getTabOptions(linkList)} />
      </Card>
    </main>
  );
}
