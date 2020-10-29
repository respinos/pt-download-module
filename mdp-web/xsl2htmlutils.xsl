<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml">

<!--
   Copyright 2006, The Regents of The University of Michigan, All Rights Reserved

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject
   to the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
   CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
   SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

  <!-- Utility template for building an HTML form elements) -->
  <xsl:template name="BuildHtmlSelect">
    <xsl:param name="id"/>
    <xsl:param name="class"/>
    <xsl:param name="key"/>

    <!-- create main "select" element -->
    <xsl:element name="select">
      <xsl:attribute name="name">
        <xsl:value-of select="Name"/>
      </xsl:attribute>

      <xsl:if test="$id">
        <xsl:attribute name="id">
          <xsl:value-of select="$id"/>
        </xsl:attribute>
      </xsl:if>

      <xsl:if test="$class">
        <xsl:attribute name="class">
          <xsl:value-of select="$class"/>
        </xsl:attribute>
      </xsl:if>

      <!-- onchange attribute -->
      <xsl:if test="$key">
        <xsl:attribute name="onchange">
          <xsl:value-of select="$key"/>
        </xsl:attribute>
      </xsl:if>

      <xsl:for-each select="Option">
        <!-- create "option" element -->
        <xsl:element name="option">
          <xsl:attribute name="value">
            <xsl:value-of select="Value"/>
          </xsl:attribute>
          <xsl:if test="../Default=Value">
            <xsl:attribute name="selected">selected</xsl:attribute>
          </xsl:if>
          <xsl:value-of select="Label"/>
        </xsl:element>

      </xsl:for-each>
    </xsl:element>
  </xsl:template>


  <!-- Hidden debug -->
  <xsl:template name="HiddenDebug">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
      <xsl:element name="input">
        <xsl:attribute name="type">hidden</xsl:attribute>
        <xsl:attribute name="name">debug</xsl:attribute>
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>
        </xsl:attribute>
      </xsl:element>
    </xsl:if>
  </xsl:template>


  <!-- HiddenVars for search form -->
  <xsl:template match="HiddenVars">
    <xsl:for-each select="Variable">
      <xsl:element name="input">
        <xsl:attribute name="type">hidden</xsl:attribute>
        <xsl:attribute name="name">
          <xsl:value-of select="./@name"/>
        </xsl:attribute>
        <xsl:attribute name="value">
          <xsl:value-of select="."/>
        </xsl:attribute>
      </xsl:element>
    </xsl:for-each>
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='skin']">
      <xsl:element name="input">
        <xsl:attribute name="type">hidden</xsl:attribute>
        <xsl:attribute name="name">skin</xsl:attribute>
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='skin']"/>
        </xsl:attribute>
      </xsl:element>
    </xsl:if>
  </xsl:template>


  <xsl:template name="ReplaceChar">
    <xsl:param name="string"/>
    <xsl:param name="from_char"/>
    <xsl:param name="to_char"/>
    <xsl:if test="contains($string, $from_char)">
      <xsl:value-of select="substring-before($string, $from_char)"/>
      <xsl:value-of select="$to_char"/>
      <xsl:call-template name="ReplaceChar">
        <xsl:with-param name="string">
          <xsl:value-of select="substring-after($string, $from_char)"/>
        </xsl:with-param>
        <xsl:with-param name="from_char">
          <xsl:value-of select="$from_char"/>
        </xsl:with-param>
        <xsl:with-param name="to_char">
          <xsl:value-of select="$to_char"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>
    <xsl:if test="not(contains($string, $from_char))">
      <xsl:value-of select="$string" />
    </xsl:if>
  </xsl:template>


  <xsl:template name="GetMaybeTruncatedTitle">
    <xsl:param name="titleString"/>
    <xsl:param name="titleFragment"/>
    <xsl:param name="maxLength"/>

    <xsl:choose>
      <xsl:when test="string-length($titleString) &lt; $maxLength">
        <xsl:value-of select="$titleString"/>
        <xsl:value-of select="concat(' ', $titleFragment)"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:variable name="nTitleString" select="concat(normalize-space($titleString), ' ')"/>

        <xsl:variable name="first" select="substring-before($nTitleString, ' ')"/>
        <xsl:variable name="rest" select="substring-after($nTitleString, ' ')"/>

        <xsl:choose>
          <xsl:when test="string-length($first) &gt;= $maxLength">
            <xsl:value-of select="concat($first,' ', '...')"/>
            <xsl:value-of select="concat(' ', $titleFragment)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="concat($first, ' ')"/>

            <xsl:call-template name="GetMaybeTruncatedTitle">
              <xsl:with-param name="titleString" select="$rest"/>
              <xsl:with-param name="titleFragment" select="$titleFragment"/>
              <xsl:with-param name="maxLength" select="$maxLength - string-length($first)"/>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>
