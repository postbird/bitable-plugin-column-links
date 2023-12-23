import "./App.css";
import { bitable, TableMeta } from "@lark-base-open/js-sdk";
import { Button, Form, Select, Alert, message, Input, Space, Card } from "antd";
import { useState, useEffect, useMemo } from "react";

export default function App() {
  const [tableMetaList, setTableMetaList] = useState<TableMeta[]>();
  const [fieldOptions, setFieldOptions] = useState<any[]>([]);
  const [tableOptions, setTableOptions] = useState<any[]>([]);
  const [results, setResults] = useState<string[]>([]);
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
    }
  };

  const linkList = useMemo(() => {
    if (!results || !results.length) {
      return [];
    }

    const _linkList: string[] = [];

    results
      .filter((item) => Boolean(item))
      .forEach((textArr) => {
        textArr.forEach((item) => {
          if (item.link) {
            _linkList.push(item.link);
          }
        });
      });
    console.log("_linkList", _linkList);
    return _linkList;
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

  return (
    <main className="main">
      <div style={{ marginBottom: 16 }}>
        <Alert
          showIcon
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
        )}
        <Button type="primary" onClick={handleOnClick}>
          Submit
        </Button>
      </Form>
      <Card size="small" title="Results" style={{ marginTop: 16 }}>
        <div>
          <Space>
            Valid Records:{matchResult.matched} / Total Records:{" "}
            {matchResult.total}
          </Space>
        </div>
        <div style={{ marginTop: 16 }}>
          {!results?.length ? null : (
            <Input.TextArea
              rows={10}
              style={{ resize: "vertical" }}
              value={displayLinkList}
            />
          )}
        </div>
      </Card>
    </main>
  );
}
